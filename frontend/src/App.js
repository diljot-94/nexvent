import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'workshop',
    status: 'draft',
    ticketTypes: [],
  });

  const [ticketType, setTicketType] = useState({
    name: '',
    price: '',
    saleStartDate: '',
    saleEndDate: '',
    maxQuantity: '',
  });

  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleTicketInputChange = (e) => {
    setTicketType({...ticketType, [e.target.name]: e.target.value});
  };

  const addTicketType = () => {
    setFormData({...formData, ticketTypes: [...formData.ticketTypes, ticketType]});
    setTicketType({
      name: '',
      price: '',
      saleStartDate: '',
      saleEndDate: '',
      maxQuantity: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/events', formData);
      setMessage('Event created successfully with ID: ' + response.data.eventId);
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        category: 'workshop',
        status: 'draft',
        ticketTypes: [],
      });
    } catch (error) {
      setMessage('Failed to create event');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto' }}>
      <h1>Create Event</h1>
      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="Title" value={formData.title} onChange={handleInputChange} required />
        <br />
        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleInputChange} />
        <br />
        <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
        <br />
        <input type="time" name="time" value={formData.time} onChange={handleInputChange} required />
        <br />
        <input name="location" placeholder="Location" value={formData.location} onChange={handleInputChange} required />
        <br />
        <select name="category" value={formData.category} onChange={handleInputChange}>
          <option value="workshop">Workshop</option>
          <option value="concert">Concert</option>
          <option value="sports">Sports</option>
          <option value="hackathon">Hackathon</option>
          <option value="other">Other</option>
        </select>
        <br />
        <select name="status" value={formData.status} onChange={handleInputChange}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <br />
        <h3>Add Ticket Type</h3>
        <input name="name" placeholder="Name" value={ticketType.name} onChange={handleTicketInputChange} required />
        <br />
        <input type="number" name="price" placeholder="Price" value={ticketType.price} onChange={handleTicketInputChange} required />
        <br />
        <input type="date" name="saleStartDate" value={ticketType.saleStartDate} onChange={handleTicketInputChange} required />
        <br />
        <input type="date" name="saleEndDate" value={ticketType.saleEndDate} onChange={handleTicketInputChange} required />
        <br />
        <input type="number" name="maxQuantity" placeholder="Max Quantity" value={ticketType.maxQuantity} onChange={handleTicketInputChange} required />
        <br />
        <button type="button" onClick={addTicketType}>Add Ticket Type</button>
        <br />
        <h4>Current Ticket Types:</h4>
        <ul>
          {formData.ticketTypes.map((t, index) => (
            <li key={index}>{t.name} - ₹{t.price}</li>
          ))}
        </ul>
        <button type="submit">Create Event</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default App;
