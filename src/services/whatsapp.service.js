require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadContentFromMessage } = require('@whiskeysockets/baileys');

const path = require('path');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const mime = require('mime-types');
const { access, rm } = require('fs/promises');
const { constants } = require('fs');

// const clients = new Map(); // Map sessionId -> socket
const clients = require('./clients');

const webhookMap = new Map();

const { handleIncomingMessages } = require('../controllers/message.controller');
const Session = require('../models/Session');

const { cleanupSession } = require('./session.service');

async function createSession(sessionId, onQR) {
    const authFolder = path.join(__dirname, '..', 'sessions', sessionId);
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: false,
        auth: state,
    });

    clients.set(sessionId, sock);

    sock.ev.on('creds.update', saveCreds);

    let connected = false;

    sock.ev.on('connection.update', async(update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr && typeof onQR === 'function') {
            // qrcode.generate(qr, { small: true});
            onQR(qr);
        }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode || null;
            if (reason !== DisconnectReason.loggedOut){
                console.log(`Reconnection ${sessionId} in 5s...`);
                setTimeout(() => createSession(sessionId), 5000);
            }
            else if (!connected){
                console.log(`QR timeout for session ${sessionId}, cleaning_up`);
                await cleanupSession(sessionId);
            } 
            else {
                console.log(` Session ${sessionId} logged out`);
                await cleanupSession(sessionId);
            }
        } else if (connection === 'open') {
            console.log(`Sessions ${sessionId} connected`);
            connected = true;
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