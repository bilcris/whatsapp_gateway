const { createSession } = require('../services/whatsapp.service');

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

module.exports = { create, }