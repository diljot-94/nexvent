const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../models');

const router = express.Router();

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Create booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { eventId, ticketTypeId, quantity } = req.body;

    // Get ticket type to calculate price
    const ticketType = await db.TicketType.findByPk(ticketTypeId);
    if (!ticketType) {
      return res.status(404).json({ error: 'Ticket type not found' });
    }

    const totalAmount = ticketType.price * quantity;

    // Create booking
    const booking = await db.Booking.create({
      userId: req.user.id,
      eventId,
      ticketTypeId,
      quantity,
      totalAmount,
      status: 'pending',
    });

    res.status(201).json({
      message: 'Booking created successfully',
      bookingId: booking.id,
      totalAmount,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get user's bookings
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await db.Booking.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: db.Event,
          as: 'event',
          attributes: ['id', 'title', 'date', 'location', 'imageUrl'],
        },
        {
          model: db.Payment,
          as: 'payment',
          attributes: ['paymentStatus', 'paymentMethod'],
        },
      ],
      order: [['bookingDate', 'DESC']],
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get booking by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await db.Booking.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: db.Event,
          as: 'event',
          attributes: ['id', 'title', 'date', 'time', 'location', 'imageUrl'],
        },
        {
          model: db.Payment,
          as: 'payment',
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

module.exports = router;
