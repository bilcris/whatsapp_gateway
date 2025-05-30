const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');

router.post('/', sessionController.create);
router.get('/', sessionController.listSessions);
router.delete('/:sessionId', sessionController.deleteSession);
router.post('/webhook', sessionController.setSesionWebhook);

module.exports = router;