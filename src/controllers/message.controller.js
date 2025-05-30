const { sendTextMessage, sendMedia, sendMediaFromUpload } = require('../services/whatsapp.service');
const Session = require('../models/Session');
const axios = require('axios');

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

async function sendMediaUpload(req, res) {
    const { sessionId = 'default', number, caption, mediaType = 'document'} = req.body;
    const file = req.file;

    if (!file || !number) {
        return res.status(400).json({ error: 'file dan number diperlukan'});
    }

    try {
        await sendMediaFromUpload(sessionId, number, file, caption, mediaType);
        res.status(200).json({ message: 'Media berhasil dikirim'});
    } catch (err) {
        res.status(500).json({ error: err.message || 'Gagal mengirim media'});
    }
}

const handleIncomingMessages = async(sessionId, { messages, type }) => {
    console.log(`[${sessionId}] Menerima ${messages?.length || 0} pesan, type: ${type}}`);

    if (!messages || messages === 0) return;

    const session = await Session.findOne({ sessionId });
    const webhookUrl = session?.webhookUrl;

    if (!webhookUrl) {
        console.warn(`[${sessionId}] Webhook belum disetel`);
        return;
    }

    for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const payload = {
            sessionId,
            from: msg.key.remoteJid,
            message: msg.message,
            timestamp: msg.messageTimestamp,
        };

        try {
            await axios.post(webhookUrl, payload);
            console.log(`Pesan diteruskan ke webhook untuk session ${sessionId}`);
        } catch (err) {
            console.error(`Gagal kirim ke webhook: `, err.message);
        }
    }
};

module.exports = { send, sendMediaMessage, sendMediaUpload, handleIncomingMessages, }