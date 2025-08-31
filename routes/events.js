const express = require('express');
const multer = require('multer');
const path = require('path');
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Get all events
router.get('/', async (req, res) => {
  try {
    const { status, category } = req.query;

    const whereClause = {};

    // Filter by status - default to published only
    if (status) {
      whereClause.status = status;
    } else {
      // By default, only show published events
      whereClause.status = 'published';
    }

    // Filter by category if provided
    if (category) {
      whereClause.category = category;
    }

    const events = await db.Event.findAll({
      where: whereClause,
      include: [{
        model: db.TicketType,
        as: 'ticketTypes',
      }],
      order: [['date', 'ASC']],
    });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create event
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, time, location, category, status, ticketTypes } = req.body;

    // Parse ticketTypes if it's a JSON string (from FormData)
    let parsedTicketTypes = ticketTypes;
    if (typeof ticketTypes === 'string') {
      try {
        parsedTicketTypes = JSON.parse(ticketTypes);
      } catch (parseError) {
        console.error('Error parsing ticketTypes JSON:', parseError);
        return res.status(400).json({ error: 'Invalid ticketTypes format' });
      }
    }

    const eventData = {
      title,
      description,
      date,
      time,
      location,
      category,
      status,
      organizerId: req.user.id,
    };

    if (req.file) {
      eventData.imageUrl = `/uploads/${req.file.filename}`;
    }

    // Create event
    const event = await db.Event.create(eventData);

    // Create ticket types if provided
    if (Array.isArray(parsedTicketTypes) && parsedTicketTypes.length > 0) {
      for (const ticket of parsedTicketTypes) {
        await db.TicketType.create({
          name: ticket.name,
          price: parseFloat(ticket.price),
          saleStartDate: ticket.saleStartDate,
          saleEndDate: ticket.saleEndDate,
          maxQuantity: parseInt(ticket.maxQuantity),
          eventId: event.id,
        });
      }
    }

    res.status(201).json({ message: 'Event created successfully', eventId: event.id });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
});

// Get events created by the authenticated user (organizer)
router.get('/my-events', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;

    const whereClause = {
      organizerId: req.user.id,
    };

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    const events = await db.Event.findAll({
      where: whereClause,
      include: [{
        model: db.TicketType,
        as: 'ticketTypes',
      }],
      order: [['date', 'ASC']],
    });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch your events' });
  }
});

// Update event status (publish/draft)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be draft or published' });
    }

    const event = await db.Event.findOne({
      where: {
        id,
        organizerId: req.user.id,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found or you do not have permission to update it' });
    }

    await event.update({ status });
    res.json({ message: 'Event status updated successfully', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
});

module.exports = router;
