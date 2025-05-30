const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');

router.post('/', sessionController.create);
router.get('/', sessionController.listSessions);
router.delete('/:sessionId', sessionController.deleteSession);
router.post('/webhook', sessionController.setSesionWebhook);
router.put('/webhook', sessionController.updateSessionWebhook);
router.delete('/webhook/:sessionId', sessionController.deleteSession);
router.get('/webhook/:sessionId', sessionController.getSessionWebhook);

module.exports = router;