const fs = require('fs/promises');
const path = require('path');
const { constants } = require('fs');
const Session = require('../models/Session');
const clients = require('./clients');

async function cleanupSession(sessionId) {
    clients.delete(sessionId);
    await Session.deleteOne({ sessionId });
    const sessionFolder = path.join(__dirname, '..', 'sessions', sessionId);
    try {
        await fs.access(sessionFolder, constants.F_OK);
        await fs.rm(sessionFolder, { recursive: true });
        console.log(`Folder ${sessionFolder} berhasil dihapus.`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`Folder ${sessionFolder} tidak ditemukan.`);
        } else {
            console.error(`Terjadi kesalahan saat menghapus folder ${sessionFolder}:`, error);
        }
    }
}

module.exports = { cleanupSession };