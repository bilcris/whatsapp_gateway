const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const multer = require('multer');

const upload = multer();

router.post('/', messageController.send);
router.post('/media', messageController.sendMediaMessage);
router.post('/upload', upload.single('file'), messageController.sendMediaUpload);

module.exports = router;