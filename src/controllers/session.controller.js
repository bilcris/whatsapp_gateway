const { createSession, getClient, clients } = require('../services/whatsapp.service');

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
    const list = [];
    for (const [sessionId, sock] of clients.entries()) {
        const isConnected = sock?.user ? true : false;
        list.push({
            sessionId,
            isConnected,
            user: sock?.user || null,
        });
    }
    res.json(list);
}

async function deleteSession(req, res) {
    const { sessionId } = req.params;
    const sock = clients.get(sessionId);
    if (!sock) {
        return res.status(404).json({ error: 'Session not found'});
    }

    try {
        await sock.logout();
        res.json({ message: `Session ${sessionId} loggout out and removed`});
    } catch (err) {
        res.status(500).json({ error: 'Failed to logout session' });
    }
}

module.exports = { create, listSessions, deleteSession, }