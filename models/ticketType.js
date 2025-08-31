const mongoose = require('mongoose');

const ticketTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,  // Changed to Number to represent price in rupees
    required: true,
  },
  saleStartDate: {
    type: Date,
    required: true,
  },
  saleEndDate: {
    type: Date,
    required: true,
  },
  maxQuantity: {
    type: Number,
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
}, { timestamps: true });

const TicketType = mongoose.model('TicketType', ticketTypeSchema);

module.exports = TicketType;
