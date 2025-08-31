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

// Process payment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { bookingId, paymentMethod, upiId, cardNumber, cardExpiry, cardCvv } = req.body;

    // Verify booking belongs to user
    const booking = await db.Booking.findOne({
      where: { id: bookingId, userId: req.user.id },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not in pending status' });
    }

    // Create payment record
    const paymentData = {
      bookingId,
      amount: booking.totalAmount,
      paymentMethod,
      paymentStatus: 'pending',
    };

    if (paymentMethod === 'upi') {
      paymentData.upiId = upiId;
    } else if (paymentMethod === 'card') {
      paymentData.cardNumber = cardNumber;
      paymentData.cardExpiry = cardExpiry;
      paymentData.cardCvv = cardCvv;
    }

    const payment = await db.Payment.create(paymentData);

    // Simulate payment processing
    setTimeout(async () => {
      try {
        // Update payment status to completed
        await payment.update({ paymentStatus: 'completed' });

        // Update booking status to confirmed
        await booking.update({ status: 'confirmed' });

        console.log(`Payment ${payment.id} completed successfully`);
      } catch (error) {
        console.error('Error processing payment:', error);
        await payment.update({ paymentStatus: 'failed' });
      }
    }, 2000); // Simulate 2 second processing time

    res.status(201).json({
      message: 'Payment initiated successfully',
      paymentId: payment.id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Get payment status
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const payment = await db.Payment.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: db.Booking,
          as: 'booking',
          where: { userId: req.user.id },
          include: [
            {
              model: db.Event,
              as: 'event',
              attributes: ['title', 'date', 'location'],
            },
          ],
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      id: payment.id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      transactionId: payment.transactionId,
      booking: {
        id: payment.booking.id,
        quantity: payment.booking.quantity,
        totalAmount: payment.booking.totalAmount,
        event: payment.booking.event,
      },
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Generate bill for payment
router.get('/:id/bill', authenticateToken, async (req, res) => {
  try {
    const payment = await db.Payment.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: db.Booking,
          as: 'booking',
          where: { userId: req.user.id },
          include: [
            {
              model: db.Event,
              as: 'event',
              attributes: ['title', 'date', 'location', 'description'],
            },
            {
              model: db.TicketType,
              as: 'ticketType',
              attributes: ['name', 'price'],
            },
            {
              model: db.User,
              as: 'user',
              attributes: ['name', 'email'],
            },
          ],
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Generate HTML bill
    const billHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Bill - NexVent</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .bill-details { margin: 20px 0; }
          .bill-details table { width: 100%; border-collapse: collapse; }
          .bill-details th, .bill-details td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .bill-details th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 18px; text-align: right; margin-top: 20px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NexVent Event Booking</h1>
          <h2>Payment Bill</h2>
        </div>

        <div class="bill-details">
          <h3>Bill Information</h3>
          <p><strong>Bill Number:</strong> ${payment.id}</p>
          <p><strong>Payment Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString()}</p>
          <p><strong>Payment Method:</strong> ${payment.paymentMethod.toUpperCase()}</p>
          <p><strong>Payment Status:</strong> ${payment.paymentStatus.toUpperCase()}</p>
          ${payment.transactionId ? `<p><strong>Transaction ID:</strong> ${payment.transactionId}</p>` : ''}
        </div>

        <div class="bill-details">
          <h3>Customer Details</h3>
          <p><strong>Name:</strong> ${payment.booking.user.name}</p>
          <p><strong>Email:</strong> ${payment.booking.user.email}</p>
        </div>

        <div class="bill-details">
          <h3>Event Details</h3>
          <p><strong>Event:</strong> ${payment.booking.event.title}</p>
          <p><strong>Date:</strong> ${new Date(payment.booking.event.date).toLocaleDateString()}</p>
          <p><strong>Location:</strong> ${payment.booking.event.location}</p>
          <p><strong>Description:</strong> ${payment.booking.event.description}</p>
        </div>

        <div class="bill-details">
          <h3>Booking Details</h3>
          <table>
            <thead>
              <tr>
                <th>Ticket Type</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${payment.booking.ticketType.name}</td>
                <td>${payment.booking.quantity}</td>
                <td>₹${payment.booking.ticketType.price}</td>
                <td>₹${payment.amount}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="total">
          <p>Grand Total: ₹${payment.amount}</p>
        </div>

        <div class="footer">
          <p>Thank you for booking with NexVent!</p>
          <p>This is a computer-generated bill.</p>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="bill-${payment.id}.html"`);
    res.send(billHtml);
  } catch (error) {
    console.error('Error generating bill:', error);
    res.status(500).json({ error: 'Failed to generate bill' });
  }
});

module.exports = router;
