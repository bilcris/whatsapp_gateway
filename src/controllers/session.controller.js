const { createSession, getClient, clients, setSessionWebhook } = require('../services/whatsapp.service');
const Session = require('../models/Session');

async function create(req, res) {
    const sessionId = req.body.sessionId || 'default';

    try {
        await createSession(sessionId);
        res.status(200).json({ message: 'Sesi dibuat, scan QR di terminal', sessionId });
    } catch (error) {
        console.log('Gagal membuat sesi: ', error);
        res.status(500).json({ error: 'Gagal membuat sesi WhatsApp'});
    }
}

async function listSessions(req, res) {
    try {
        const sessions = await Session.find().lean();
        const result = sessions.map((session) => {
            const sock = clients.get(session.sessionId);
            return {
                sessionId: session.sessionId,
                isConnected: !!sock?.user,
                user: sock?.user || session.user || null,
                webhookUrl: session.webhookUrl || null,
                status: sock?.user ? 'connected' : 'disconnected',
                updateAt: session.updateAt,
            };
        });

        res.json(result);
    } catch (err) {
        console.error('Gagal mengambil daftar session:', err);
        res.status(500).json({ error: 'Gagal mengambil daftar session' });
    }
}

async function deleteSession(req, res) {
    const { sessionId } = req.params;
    const sock = clients.get(sessionId);
    if (!sock) {
        return res.status(404).json({ error: 'Session not found'});
    }

    try {
        await sock.logout();
        clients.delete(sessionId);
        await Session.deleteOne({ sessionId });
        res.json({ message: `Session ${sessionId} berhasil dihapus` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to logout session' });
    }
}

const setSesionWebhook = async (req, res) => {
    const { sessionId = 'default', webhookUrl } = req.body;
    if (!webhookUrl) {
        return res.status(400).json({ error: 'webhookUrl diperlukan'});
    }

    await Session.findOneAndUpdate(
        { sessionId },
        { webhookUrl },
        { upsert: true, new: true }
    );
    // setSessionWebhook(sessionId, webhookUrl);
    res.json({ message: `Webhook untuk session ${sessionId} disimpan.`});
};

async function deleteSessionWebhook(req, res) {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId });
    if (!session) {
        return res.status(404).json({ erro: 'Session tidak ditemukan' });
    }

    session.webhookUrl = null;
    await session.save();

    res.json({ message: `Webhook untuk session ${sessionId} dihapus. ` });
}

async function updateSessionWebhook(req, res) {
    const { sessionId ='default', webhookUrl } = req.body;
    if (!webhookUrl) {
        return res.status(400).json({ error: 'webhookUrl diperlukan' });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
        return res.status(404).json({ erro: 'Session tidak ditemukan' });
    }

    session.webhookUrl = webhookUrl;
    await session.save();

    res.json({ message: `Webhook untuk session ${sessionId} diperbarui.` });
    
}

async function getSessionWebhook(req,res) {
    const { sessionId } = req.params;

    try {
        const session = await Session.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ error: 'Session tidak ditemukan' });
        }

        res.json({ sessionId, webhookUrl: session.webhookUrl || null });
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengambil data webhook'});
    }
}

module.exports = { create, listSessions, deleteSession, setSesionWebhook, deleteSessionWebhook, updateSessionWebhook, getSessionWebhook, }