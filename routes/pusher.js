const express = require('express');
const router = express.Router();
const pusher = require('../pusher');

// Route to trigger Pusher event
router.post('/trigger-event', async (req, res) => {
  try {
    const { channel, event, message } = req.body;

    // Trigger the Pusher event
    await pusher.trigger(channel, event, { message });

    console.log(`Event triggered on channel: ${channel}, event: ${event}`);
    res.status(200).json({ success: true, message: 'Event triggered successfully' });
  } catch (error) {
    console.error('Error triggering event:', error);
    res.status(500).json({ success: false, error: 'Failed to trigger event' });
  }
});

module.exports = router;
