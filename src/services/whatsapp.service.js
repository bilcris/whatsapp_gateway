require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadContentFromMessage } = require('@whiskeysockets/baileys');

const path = require('path');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const mime = require('mime-types');

const clients = new Map(); // Map sessionId -> socket

const webhookMap = new Map();

const { handleIncomingMessages } = require('../controllers/message.controller');
const Session = require('../models/Session');

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

    sock.ev.on('connection.update', async(update) => {
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
            
            const user = sock.user;
            await Session.findOneAndUpdate(
                { sessionId },
                { sessionId,
                    status: 'connected',
                    user: {
                        id: user.id,
                        name: user.name,
                        pushname: user.name || '',
                    },
                },
                { upsert: true }
            );
        }
    });
    
    sock.ev.on('messages.upsert', (msg) => handleIncomingMessages(sessionId, msg));

    return sock;
}

function getClient(sessionId = 'default') {
    return clients.get(sessionId);
}

function setSessionWebhook(sessionId, url) {
    webhookMap.set(sessionId, url);
}

function getSessionWebhook(sessionId) {
    return webhookMap.get(sessionId);
}

module.exports = {
    createSession, getClient, clients, setSessionWebhook, getSessionWebhook,
};