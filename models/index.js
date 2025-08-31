// Mongoose models for MongoDB
const User = require('./user');
const Event = require('./event');
const TicketType = require('./ticketType');
const Booking = require('./booking');
const Payment = require('./payment');

const db = {
  User,
  Event,
  TicketType,
  Booking,
  Payment,
};

module.exports = db;
