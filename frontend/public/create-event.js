// JavaScript for Create Event page

const apiBaseUrl = 'http://localhost:5000/api';

// Function to add a new ticket type form
function addTicketTypeForm() {
  const container = document.getElementById('ticket-types-container');
  const ticketForms = container.querySelectorAll('.ticket-type-form');
  const newForm = ticketForms[0].cloneNode(true);

  // Clear input values
  newForm.querySelectorAll('input').forEach(input => input.value = '');

  // Show remove button for all forms
  container.querySelectorAll('.remove-ticket-btn').forEach(btn => btn.style.display = 'block');

  // Hide remove button for the new form (only if there's more than one)
  if (ticketForms.length >= 1) {
    newForm.querySelector('.remove-ticket-btn').style.display = 'block';
  }

  container.appendChild(newForm);
}

// Function to remove a ticket type form
function removeTicketTypeForm(button) {
  const container = document.getElementById('ticket-types-container');
  const ticketForms = container.querySelectorAll('.ticket-type-form');

  if (ticketForms.length > 1) {
    button.closest('.ticket-type-form').remove();

    // Hide remove button if only one form remains
    if (container.querySelectorAll('.ticket-type-form').length === 1) {
      container.querySelector('.remove-ticket-btn').style.display = 'none';
    }
  }
}

// Event listeners for add/remove ticket type buttons
document.addEventListener('DOMContentLoaded', () => {
  const addTicketBtn = document.getElementById('add-ticket-btn');
  if (addTicketBtn) {
    addTicketBtn.addEventListener('click', addTicketTypeForm);
  }

  // Event delegation for remove buttons
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-ticket-btn')) {
      removeTicketTypeForm(e.target);
    }
  });
});

if (document.getElementById('createEventForm')) {
  document.getElementById('createEventForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to create an event.');
      window.location.href = 'login.html';
      return;
    }

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const location = document.getElementById('location').value;
    const category = document.getElementById('category').value;
    const status = document.getElementById('status').value;
    const imageInput = document.getElementById('image');

    // Collect ticket types data
    const ticketTypes = [];
    const ticketForms = document.querySelectorAll('.ticket-type-form');

    ticketForms.forEach(form => {
      const name = form.querySelector('.ticket-name').value;
      const price = parseFloat(form.querySelector('.ticket-price').value);
      const maxQuantity = parseInt(form.querySelector('.ticket-max-quantity').value);
      const saleStartDate = form.querySelector('.ticket-sale-start').value;
      const saleEndDate = form.querySelector('.ticket-sale-end').value;

      if (name && price >= 0 && maxQuantity > 0 && saleStartDate && saleEndDate) {
        ticketTypes.push({
          name,
          price,
          maxQuantity,
          saleStartDate,
          saleEndDate
        });
      }
    });

    if (ticketTypes.length === 0) {
      alert('Please add at least one ticket type.');
      return;
    }

    // Use FormData for file upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('date', date);
    formData.append('time', time);
    formData.append('location', location);
    formData.append('category', category);
    formData.append('status', status);
    formData.append('ticketTypes', JSON.stringify(ticketTypes));

    // Add image if selected
    if (imageInput && imageInput.files.length > 0) {
      formData.append('image', imageInput.files[0]);
    }

    try {
      const res = await fetch(`${apiBaseUrl}/events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert('Event created successfully with tickets!');
        window.location.href = 'index.html#events';
      } else {
        alert(data.error || 'Failed to create event');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while creating the event');
    }
  });
}
