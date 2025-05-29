const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');

router.post('/', messageController.send);
router.post('/media', messageController.sendMediaMessage);

module.exports = router;