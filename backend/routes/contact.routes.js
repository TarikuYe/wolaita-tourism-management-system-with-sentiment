const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../services/mailer');

router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Name, email, and message are required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email address'
      });
    }

    // Trim and validate input lengths
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMessage = message.trim();

    if (trimmedName.length < 2) {
      return res.status(400).json({ 
        error: 'Name must be at least 2 characters long'
      });
    }

    if (trimmedMessage.length < 10) {
      return res.status(400).json({ 
        error: 'Message must be at least 10 characters long'
      });
    }

    if (trimmedMessage.length > 5000) {
      return res.status(400).json({ 
        error: 'Message is too long (maximum 5000 characters)'
      });
    }

    // Send email
    await sendContactEmail({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage
    });

    console.log(`Contact form submission received from ${trimmedEmail}`);

    res.status(200).json({ 
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon.' 
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'Failed to send message. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

