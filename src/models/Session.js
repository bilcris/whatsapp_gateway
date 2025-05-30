const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    status: { type: String, default: 'disconnected' },
    user: {
        id: String,
        name: String,
        pushname: String,
    },
    webhookUrl: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);