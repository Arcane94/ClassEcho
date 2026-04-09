// Visualization routes: manage replay setup, code snapshots, emoji reactions, and playback data.
const express = require('express');
const visualizationController = require('../controllers/VisualizationController');

const router = express.Router();

router.get('/code-urls', visualizationController.getCodeUrls);
router.get('/code-snapshot', visualizationController.getCodeSnapshot);
router.get('/emoji-reactions', visualizationController.getEmojiReactions);
router.get('/sessions/:sessionId/setup', visualizationController.getSessionSetup);
router.put('/sessions/:sessionId/setup', visualizationController.updateSessionSetup);

module.exports = router;
