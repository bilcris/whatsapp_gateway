const { sendTextMessage, sendMedia } = require('../services/whatsapp.service');

async function send(req, res) {
    const { sessionId = 'default', number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ error: 'number and message are require'});
    }

    try {
        await sendTextMessage(sessionId, number, message);
        res.status(200).json({ message: 'Pesan berhasil dikirim'});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Gagal mengirim pesan' });
    }
}

async function sendMediaMessage(req, res) {
    const { sessionId = 'default', number, fileUrl, caption, mediaType = 'document' } = req.body;
    if (!number || !fileUrl) {
        return res.status(400).json({ error: 'number dan fileUrl diperlukan' });
    }

    try {
        await sendMedia(sessionId, number, fileUrl, caption, mediaType);
        res.status(200).json({ message: 'Media berhasil dikirim'});
    } catch (err) {
        res.status(500).json({ error: err.message || 'Gagal mengirim media' });
    }
}

module.exports = { send, sendMediaMessage }