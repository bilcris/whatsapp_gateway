const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadContentFromMessage } = require('@whiskeysockets/baileys');

const path = require('path');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const mime = require('mime-types');

const clients = new Map(); // Map sessionId -> socket

async function createSession(sessionId = 'default') {
    const authFolder = path.join(__dirname, '..', 'sessions', sessionId);
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: true,
        auth: state,
    });

    clients.set(sessionId, sock);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true});
        }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode || null;
            if (reason !== DisconnectReason.loggedOut){
                console.log(`Reconnection ${sessionId} in 5s...`);
                setTimeout(() => createSession(sessionId), 5000);
            } else {
                console.log(` Session ${sessionId} logged out`);
                clients.delete(sessionId);
            }
        } else if (connection === 'open') {
            console.log(`Sessions ${sessionId} connected`);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const webhookUrl = process.env.WEBHOOK_URL;
        if (!messages || messages.length === 0 || !webhookUrl) return;

        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;
            const payload = {
                sessionId,
                send: msg.key.remoteJid || msg.key.participant,
                message: msg.message,
                timestamp: msg.messageTimestamp,
            }

            try {
                await axios.post(webhookUrl, payload);
                console.log(` Pesan diteruskan ke webhook untuk session ${sessionId}`);
            } catch (err) {
                console.error(` Gagal kirim pesan ke webhook: `, err.message);
            }
        }
    });

    return sock;
}

function getClient(sessionId = 'default') {
    return clients.get(sessionId);
}

async function sendTextMessage(sessionId, number, message) {
    const sock = clients.get(sessionId);
    if (!sock) throw new Error('Session not found');
    if (!sock.user) throw new Error('Session not connected to WhatsApp')

    const jid = number.includes('@s.whatsapp.net') ? number: `${number}@s.whatsapp.net`;
    try {
        await sock.sendMessage(jid, { text: message});
    } catch (err) {
        console.error(`Gagak mengirim pesan: ${err.message}`);
        throw err;
    }
}

async function sendMedia(sessionId, number, fileUrl, caption = '', mediaType = 'document') {
    const sock = clients.get(sessionId);
    if (!sock) throw new Error('Session not found');
    if (!sock.user) throw new Error('Session not connected to WhatsApp')

    const response = await axios.get(fileUrl, { responseType: 'arraybuffer'});
    const buffer = Buffer.from(response.data, 'binary');
    let message;
    const jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;

    switch (mediaType) {
        case 'image':
            message = { image : buffer };
            break;
        case 'video':
            message = {video: buffer };
            break;
        case 'audio':
            message = { 
                audio : buffer,
                mimetype : 'audio/ogg; codecs=opus'
             };
            break;
        default:
            message = { 
                document : buffer,
                fileName : fileUrl.split('/').pop(),
                mimetype : mime.lookup(message.fileName) || 'application/octet-stream'
            }
            break;
    }

    if (caption) {
        message.caption = caption;
    }

    await sock.sendMessage(jid, message);
}

module.exports = {
    createSession, getClient, clients, sendTextMessage, sendMedia,
};