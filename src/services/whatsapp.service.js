const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');

const path = require('path');
const qrcode = require('qrcode-terminal');

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

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true});
        }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut){
                console.log(`Reconnection ${sessionId}...`);
                createSession(sessionId);
            } else {
                console.log(` Session ${sessionId} logged out`);
                clients.delete(sessionId);
            }
        } else if (connection === 'open') {
            console.log(`Sessions ${sessionId} connected`);
            clients.set(sessionId, sock);
        }
    });

    return sock;
}

function getClient(sessionId = 'default') {
    return clients.get(sessionId);
}

async function sendTextMessage(sessionId, number, message) {
    const sock = clients.get(sessionId);
    if (!sock) {
        throw new Error('Session not found or not connected');
    }

    const jid = number.includes('@s.whatsapp.net') ? number: `${number}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message});
}

module.exports = {
    createSession, getClient, sendTextMessage,
};