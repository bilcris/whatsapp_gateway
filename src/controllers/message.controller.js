const { sendTextMessage } = require('../services/whatsapp.service');

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

module.exports = { send }