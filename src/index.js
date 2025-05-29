require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sessionRoutes = require('./routes/session.routes');

const app = express();
const PORT = process.env.PORT || 5000

app.use(cors());
app.use(express.json());

app.use('/sessions', sessionRoutes);

app.get('/', (req, res) => res.send('WhatsApp Gateway API Aktif'));

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`)
})