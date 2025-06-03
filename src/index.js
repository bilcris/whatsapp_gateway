require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sessionRoutes = require('./routes/session.routes');
const messageRoutes = require('./routes/message.routes');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path')
const { createSession } = require('./services/whatsapp.service');
const { error } = require('console');
const sessionDir = path.join(__dirname, 'sessions');

const connectDB = require('./config/db');
connectDB();

const app = express();
const PORT = process.env.PORT || 5000

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}


fsPromises.readdir(sessionDir).then(async (sessionIds) => {
    for (const sessionId of sessionIds) {
        try {
            await createSession(sessionId);
            console.log(`Session ${sessionId} berhasil dipulihkan.`);
        } catch (err) {
            console.log(`Gagal memuat sesi ${sessionId}: ${err.message}`);
            await cleanupSession(sessionId);
            console.log(`Sesi ${sessionId} berhasil dihapus.`)
        }
    }
}).catch(err => {
    console.error('Gagal membaca directori sessions: ', err.message);
})

app.use('/sessions', sessionRoutes);
app.use('/messages', messageRoutes);

app.get('/', (req, res) => res.send('whatsapp'));

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`)
})