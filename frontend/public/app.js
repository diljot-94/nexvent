// Frontend JavaScript for NexVent Event Booking Platform

const apiBaseUrl = 'http://localhost:5000/api';

// Elements
const eventsList = document.getElementById('events-list');
const profileMenu = document.querySelector('.profile-menu');
const loginLinks = document.querySelectorAll('.login-link, .register-link');
const profileCircle = document.getElementById('profileCircle');
const profileDropdown = document.getElementById('profileDropdown');
const editNameInput = document.getElementById('editName');
const editMobileInput = document.getElementById('editMobile');
const editImageInput = document.getElementById('editImage');
const saveProfileBtn = document.getElementById('saveProfile');
const logoutBtn = document.getElementById('logoutBtn');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

let currentUser = null;

// Utility: Check if user is logged in (using localStorage token)
function isLoggedIn() {
  return !!localStorage.getItem('token');
}

// Fetch events from backend and render
async function loadEvents() {
  try {
    const res = await fetch(`${apiBaseUrl}/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    const events = await res.json();
    renderEvents(events);

    // If user is logged in, also load their events
    if (isLoggedIn()) {
      loadMyEvents();
    }
  } catch (error) {
    console.error(error);
    eventsList.innerHTML = '<p>Failed to load events.</p>';
  }
}

// Load events created by the current user
async function loadMyEvents() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${apiBaseUrl}/events/my-events`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch your events');
    const myEvents = await res.json();

    // Add organizer section if not exists
    let organizerSection = document.getElementById('organizer-section');
    if (!organizerSection && myEvents.length > 0) {
      organizerSection = document.createElement('div');
      organizerSection.id = 'organizer-section';
      organizerSection.innerHTML = `
        <div class="container">
          <h2 class="section-title">My Events</h2>
          <div id="my-events-list" class="events-grid"></div>
        </div>
      `;
      document.querySelector('main').appendChild(organizerSection);
    }

    if (myEvents.length > 0) {
      renderMyEvents(myEvents);
    }
  } catch (error) {
    console.error(error);
  }
}

// Render events in the events grid
function renderEvents(events) {
  if (!events.length) {
    eventsList.innerHTML = '<p>No upcoming events.</p>';
    return;
  }
  eventsList.innerHTML = '';
  events.forEach(event => {
    const card = document.createElement('div');
    card.className = 'event-card';

    const imageDiv = document.createElement('div');
    imageDiv.className = 'event-image';

    if (event.imageUrl) {
      const img = document.createElement('img');
      img.src = `http://localhost:5000${event.imageUrl}`;
      img.alt = event.title;
      img.onload = () => {
        // Image loaded successfully
        imageDiv.innerHTML = '';
        imageDiv.appendChild(img);
      };
      img.onerror = () => {
        // Fallback to stylish placeholder
        renderStylishPlaceholder(imageDiv, event);
      };
    } else {
      // Stylish placeholder if no image
      renderStylishPlaceholder(imageDiv, event);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'event-content';

    const title = document.createElement('h3');
    title.className = 'event-title';
    title.textContent = event.title;

    const metaDiv = document.createElement('div');
    metaDiv.className = 'event-meta';

    const date = document.createElement('p');
    date.className = 'event-date';
    date.innerHTML = `<i class="fas fa-calendar"></i> ${new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })}`;

    const location = document.createElement('p');
    location.className = 'event-location';
    location.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${event.location}`;

    metaDiv.appendChild(date);
    metaDiv.appendChild(location);

    const description = document.createElement('p');
    description.className = 'event-description';
    description.textContent = event.description || '';

    // Add ticket types and prices
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      const price = document.createElement('p');
      price.className = 'event-price';
      const minPrice = Math.min(...event.ticketTypes.map(t => t.price));
      price.innerHTML = `<i class="fas fa-rupee-sign"></i> ${minPrice}`;
      contentDiv.appendChild(price);

      // Add ticket types section
      const ticketsSection = document.createElement('div');
      ticketsSection.className = 'event-tickets';
      ticketsSection.innerHTML = `
        <h4>Available Tickets:</h4>
        <div class="ticket-list">
          ${event.ticketTypes.map(ticket => `
            <div class="ticket-item">
              <span class="ticket-name">${ticket.name}</span>
              <span class="ticket-price">₹${ticket.price}</span>
              <span class="ticket-quantity">Max: ${ticket.maxQuantity}</span>
            </div>
          `).join('')}
        </div>
      `;
      contentDiv.appendChild(ticketsSection);
    }

    const bookBtn = document.createElement('button');
    bookBtn.className = 'book-ticket-btn';
    bookBtn.innerHTML = '<i class="fas fa-ticket-alt"></i> Book Tickets';
    bookBtn.onclick = () => openBookingModal(event);

    contentDiv.appendChild(title);
    contentDiv.appendChild(metaDiv);
    contentDiv.appendChild(description);
    contentDiv.appendChild(bookBtn);

    card.appendChild(imageDiv);
    card.appendChild(contentDiv);

    eventsList.appendChild(card);
  });
}

// Function to render stylish placeholder for events without images
function renderStylishPlaceholder(container, event) {
  container.innerHTML = '';

  // Create a gradient background based on event category or random
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  ];

  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
  container.style.background = randomGradient;

  // Add animated elements
  const iconContainer = document.createElement('div');
  iconContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: white;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  `;

  // Choose icon based on event title keywords
  let iconClass = 'fas fa-calendar-day';
  const title = event.title.toLowerCase();

  if (title.includes('music') || title.includes('concert') || title.includes('band')) {
    iconClass = 'fas fa-music';
  } else if (title.includes('tech') || title.includes('conference') || title.includes('workshop')) {
    iconClass = 'fas fa-laptop-code';
  } else if (title.includes('food') || title.includes('cooking') || title.includes('restaurant')) {
    iconClass = 'fas fa-utensils';
  } else if (title.includes('sports') || title.includes('game') || title.includes('tournament')) {
    iconClass = 'fas fa-trophy';
  } else if (title.includes('art') || title.includes('gallery') || title.includes('exhibition')) {
    iconClass = 'fas fa-palette';
  } else if (title.includes('party') || title.includes('celebration') || title.includes('festival')) {
    iconClass = 'fas fa-glass-cheers';
  } else if (title.includes('theater') || title.includes('drama') || title.includes('play')) {
    iconClass = 'fas fa-theater-masks';
  } else if (title.includes('dance') || title.includes('ballet') || title.includes('performance')) {
    iconClass = 'fas fa-dancing';
  }

  const icon = document.createElement('i');
  icon.className = iconClass;
  icon.style.cssText = `
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: bounce 2s ease-in-out infinite;
  `;

  const eventType = document.createElement('div');
  eventType.style.cssText = `
    font-size: 1.2rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.9;
  `;

  // Determine event type
  if (title.includes('music') || title.includes('concert')) eventType.textContent = 'Music Event';
  else if (title.includes('tech') || title.includes('conference')) eventType.textContent = 'Tech Conference';
  else if (title.includes('food') || title.includes('cooking')) eventType.textContent = 'Food Festival';
  else if (title.includes('sports') || title.includes('game')) eventType.textContent = 'Sports Event';
  else if (title.includes('art') || title.includes('gallery')) eventType.textContent = 'Art Exhibition';
  else if (title.includes('party') || title.includes('celebration')) eventType.textContent = 'Celebration';
  else if (title.includes('theater') || title.includes('drama')) eventType.textContent = 'Theater';
  else if (title.includes('dance') || title.includes('ballet')) eventType.textContent = 'Dance Show';
  else eventType.textContent = 'Special Event';

  iconContainer.appendChild(icon);
  iconContainer.appendChild(eventType);
  container.appendChild(iconContainer);

  // Add CSS animation for bounce effect
  const style = document.createElement('style');
  style.textContent = `
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
  `;
  document.head.appendChild(style);
}

// Booking modal functionality
let currentBookingEvent = null;

function openBookingModal(event) {
  if (!isLoggedIn()) {
    alert('Please login to book tickets');
    window.location.href = 'login.html';
    return;
  }

  currentBookingEvent = event;

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'booking-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Book Tickets for ${event.title}</h3>
        <span class="close-modal">&times;</span>
      </div>
      <div class="modal-body">
        <div class="event-details">
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Location:</strong> ${event.location}</p>
          <p><strong>Description:</strong> ${event.description}</p>
        </div>

        <div class="ticket-selection">
          <h4>Select Ticket Type</h4>
          ${event.ticketTypes && event.ticketTypes.length > 0 ?
            event.ticketTypes.map(ticketType => `
              <div class="ticket-option">
                <input type="radio" id="ticket-${ticketType.id}" name="ticketType" value="${ticketType.id}">
                <label for="ticket-${ticketType.id}">
                  <span class="ticket-name">${ticketType.name}</span>
                  <span class="ticket-price">₹${ticketType.price}</span>
                </label>
              </div>
            `).join('') :
            '<p>No ticket types available</p>'
          }
        </div>

        <div class="quantity-selection">
          <label for="quantity">Quantity:</label>
          <input type="number" id="booking-quantity" min="1" max="10" value="1">
        </div>

        <div class="booking-summary">
          <p><strong>Total: ₹<span id="total-amount">0.00</span></strong></p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn">Cancel</button>
        <button class="proceed-btn">Proceed to Payment</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add event listeners
  modal.querySelector('.close-modal').onclick = () => modal.remove();
  modal.querySelector('.cancel-btn').onclick = () => modal.remove();

  // Update total when ticket type or quantity changes
  const ticketInputs = modal.querySelectorAll('input[name="ticketType"]');
  const quantityInput = modal.querySelector('#booking-quantity');
  const totalAmount = modal.querySelector('#total-amount');

  function updateTotal() {
    const selectedTicket = modal.querySelector('input[name="ticketType"]:checked');
    if (selectedTicket) {
      const ticketType = event.ticketTypes.find(t => t.id == selectedTicket.value);
      const quantity = parseInt(quantityInput.value) || 1;
      totalAmount.textContent = (ticketType.price * quantity).toFixed(2);
    }
  }

  ticketInputs.forEach(input => input.addEventListener('change', updateTotal));
  quantityInput.addEventListener('input', updateTotal);

  // Proceed to payment
  modal.querySelector('.proceed-btn').onclick = () => {
    const selectedTicket = modal.querySelector('input[name="ticketType"]:checked');
    const quantity = parseInt(quantityInput.value) || 1;

    if (!selectedTicket) {
      alert('Please select a ticket type');
      return;
    }

    const ticketType = event.ticketTypes.find(t => t.id == selectedTicket.value);
    proceedToPayment(event, ticketType, quantity);
    modal.remove();
  };

  // Close modal when clicking outside
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };
}

function proceedToPayment(event, ticketType, quantity) {
  const totalAmount = ticketType.price * quantity;

  // Create payment modal
  const paymentModal = document.createElement('div');
  paymentModal.className = 'payment-modal';
  paymentModal.innerHTML = `
    <div class="modal-content payment-content">
      <div class="modal-header">
        <h3>Complete Payment</h3>
        <span class="close-modal">&times;</span>
      </div>
      <div class="modal-body">
        <div class="payment-summary">
          <h4>Booking Summary</h4>
          <p><strong>Event:</strong> ${event.title}</p>
          <p><strong>Ticket:</strong> ${ticketType.name}</p>
          <p><strong>Quantity:</strong> ${quantity}</p>
          <p><strong>Total Amount:</strong> ₹${totalAmount.toFixed(2)}</p>
        </div>

        <div class="payment-methods">
          <h4>Select Payment Method</h4>

          <div class="payment-option">
            <input type="radio" id="upi" name="paymentMethod" value="upi" checked>
            <label for="upi">
              <i class="fas fa-mobile-alt"></i>
              <span>UPI Payment</span>
            </label>
          </div>

          <div class="payment-option">
            <input type="radio" id="card" name="paymentMethod" value="card">
            <label for="card">
              <i class="fas fa-credit-card"></i>
              <span>Credit/Debit Card</span>
            </label>
          </div>
        </div>

        <div id="upi-section" class="payment-details">
          <label for="upi-id">UPI ID:</label>
          <input type="text" id="upi-id" placeholder="yourname@upi" required>
          <small>Enter your UPI ID (e.g., yourname@paytm)</small>
        </div>

        <div id="card-section" class="payment-details" style="display: none;">
          <div class="form-row">
            <div class="form-group">
              <label for="card-number">Card Number:</label>
              <input type="text" id="card-number" placeholder="1234 5678 9012 3456" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="card-expiry">Expiry Date:</label>
              <input type="text" id="card-expiry" placeholder="MM/YY" required>
            </div>
            <div class="form-group">
              <label for="card-cvv">CVV:</label>
              <input type="text" id="card-cvv" placeholder="123" required>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn">Cancel</button>
        <button class="pay-btn">Pay Now</button>
      </div>
    </div>
  `;

  document.body.appendChild(paymentModal);

  // Payment method switching
  const paymentMethods = paymentModal.querySelectorAll('input[name="paymentMethod"]');
  paymentMethods.forEach(method => {
    method.addEventListener('change', () => {
      const upiSection = paymentModal.querySelector('#upi-section');
      const cardSection = paymentModal.querySelector('#card-section');

      if (method.value === 'upi') {
        upiSection.style.display = 'block';
        cardSection.style.display = 'none';
      } else {
        upiSection.style.display = 'none';
        cardSection.style.display = 'block';
      }
    });
  });

  // Add event listeners
  paymentModal.querySelector('.close-modal').onclick = () => paymentModal.remove();
  paymentModal.querySelector('.cancel-btn').onclick = () => paymentModal.remove();

  // Process payment
  paymentModal.querySelector('.pay-btn').onclick = async () => {
    const paymentMethod = paymentModal.querySelector('input[name="paymentMethod"]:checked').value;

    let paymentData = {
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity,
      paymentMethod,
    };

    if (paymentMethod === 'upi') {
      const upiId = paymentModal.querySelector('#upi-id').value;
      if (!upiId) {
        alert('Please enter your UPI ID');
        return;
      }
      paymentData.upiId = upiId;

      // Simulate UPI app redirect
      simulateUPIRedirect(upiId, totalAmount, event.title);
      paymentModal.remove();
      return;
    } else {
      const cardNumber = paymentModal.querySelector('#card-number').value;
      const cardExpiry = paymentModal.querySelector('#card-expiry').value;
      const cardCvv = paymentModal.querySelector('#card-cvv').value;

      if (!cardNumber || !cardExpiry || !cardCvv) {
        alert('Please fill in all card details');
        return;
      }
      paymentData.cardNumber = cardNumber;
      paymentData.cardExpiry = cardExpiry;
      paymentData.cardCvv = cardCvv;
    }

    await processPayment(paymentData);
    paymentModal.remove();
  };

  // Close modal when clicking outside
  paymentModal.onclick = (e) => {
    if (e.target === paymentModal) {
      paymentModal.remove();
    }
  };
}

async function processPayment(paymentData) {
  try {
    const token = localStorage.getItem('token');

    // First create booking
    const bookingRes = await fetch(`${apiBaseUrl}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        eventId: paymentData.eventId,
        ticketTypeId: paymentData.ticketTypeId,
        quantity: paymentData.quantity,
      }),
    });

    if (!bookingRes.ok) {
      throw new Error('Failed to create booking');
    }

    const bookingData = await bookingRes.json();

    // Then process payment
    const paymentRes = await fetch(`${apiBaseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bookingId: bookingData.bookingId,
        paymentMethod: paymentData.paymentMethod,
        upiId: paymentData.upiId,
        cardNumber: paymentData.cardNumber,
        cardExpiry: paymentData.cardExpiry,
        cardCvv: paymentData.cardCvv,
      }),
    });

    if (!paymentRes.ok) {
      throw new Error('Failed to process payment');
    }

    const paymentResult = await paymentRes.json();

    alert(`Payment initiated successfully! Payment ID: ${paymentResult.paymentId}`);

    // Show success message and redirect
    setTimeout(() => {
      alert('Payment completed successfully! Your tickets have been booked.');
      window.location.reload();
    }, 2000);

  } catch (error) {
    console.error('Payment error:', error);
    alert('Payment failed. Please try again.');
  }
}

// Show or hide profile menu dropdown
function toggleProfileDropdown() {
  if (profileDropdown.style.display === 'block') {
    profileDropdown.style.display = 'none';
  } else {
    profileDropdown.style.display = 'block';
  }
}

// Load user profile data into form
async function loadUserProfile() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`${apiBaseUrl}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load profile');
    const user = await res.json();
    currentUser = user;
    editNameInput.value = user.name || '';
    editMobileInput.value = user.mobile || '';
    if (user.imageUrl) {
      document.getElementById('profileImg').src = `http://localhost:5000${user.imageUrl}`;
    }
  } catch (error) {
    console.error(error);
  }
}

// Save profile changes
async function saveProfile() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return alert('Not logged in');
    const formData = new FormData();
    formData.append('name', editNameInput.value);
    formData.append('mobile', editMobileInput.value);
    if (editImageInput.files.length > 0) {
      formData.append('image', editImageInput.files[0]);
    }
    const res = await fetch(`${apiBaseUrl}/users/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to save profile');
    alert('Profile updated successfully');
    profileDropdown.style.display = 'none';
    loadUserProfile();
  } catch (error) {
    console.error(error);
    alert('Error saving profile');
  }
}

// Logout functionality
function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  profileDropdown.style.display = 'none';
  updateUIForLogin();
  alert('Logged out successfully');
  // Optional: redirect to home page
  // window.location.href = '/index.html';
}

// Update UI based on login state
function updateUIForLogin() {
  if (isLoggedIn()) {
    profileMenu.style.display = 'flex';
    loginLinks.forEach(link => link.style.display = 'none');
    loadUserProfile();
  } else {
    profileMenu.style.display = 'none';
    loginLinks.forEach(link => link.style.display = 'block');
  }
}

// Hamburger menu toggle
hamburger.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

// Profile circle click toggles dropdown
profileCircle.addEventListener('click', toggleProfileDropdown);

// Save profile button click
saveProfileBtn.addEventListener('click', saveProfile);

// Logout button click
logoutBtn.addEventListener('click', logout);

// Close profile dropdown if clicked outside
document.addEventListener('click', (e) => {
  if (!profileDropdown.contains(e.target) && !profileCircle.contains(e.target)) {
    profileDropdown.style.display = 'none';
  }
});

// Simulate UPI app redirect
function simulateUPIRedirect(upiId, amount, eventTitle) {
  // Create UPI redirect modal
  const upiModal = document.createElement('div');
  upiModal.className = 'upi-redirect-modal';
  upiModal.innerHTML = `
    <div class="modal-content upi-content">
      <div class="modal-header">
        <h3>UPI Payment</h3>
      </div>
      <div class="modal-body">
        <div class="upi-apps">
          <h4>Choose your UPI app:</h4>
          <div class="upi-app-grid">
            <button class="upi-app-btn" data-app="gpay">
              <i class="fab fa-google-pay"></i>
              <span>Google Pay</span>
            </button>
            <button class="upi-app-btn" data-app="paytm">
              <i class="fas fa-wallet"></i>
              <span>Paytm</span>
            </button>
            <button class="upi-app-btn" data-app="phonepe">
              <i class="fas fa-mobile-alt"></i>
              <span>PhonePe</span>
            </button>
            <button class="upi-app-btn" data-app="bhim">
              <i class="fas fa-university"></i>
              <span>BHIM UPI</span>
            </button>
          </div>
        </div>

        <div class="upi-details">
          <p><strong>Paying to:</strong> NexVent</p>
          <p><strong>Amount:</strong> ₹${amount.toFixed(2)}</p>
          <p><strong>UPI ID:</strong> ${upiId}</p>
          <p><strong>For:</strong> ${eventTitle}</p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(upiModal);

  // Add event listeners for UPI app buttons
  const upiAppBtns = upiModal.querySelectorAll('.upi-app-btn');
  upiAppBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const appName = btn.dataset.app;

      // Show UPI app payment confirmation screen
      upiModal.innerHTML = `
        <div class="modal-content upi-content">
          <div class="modal-header">
            <h3>${appName} - Payment</h3>
          </div>
          <div class="modal-body">
            <div class="upi-payment-confirm">
              <div class="payment-details">
                <h4>Confirm Payment</h4>
                <div class="payment-info">
                  <p><strong>Merchant:</strong> NexVent</p>
                  <p><strong>Amount:</strong> ₹${amount.toFixed(2)}</p>
                  <p><strong>UPI ID:</strong> ${upiId}</p>
                  <p><strong>Description:</strong> ${eventTitle}</p>
                </div>
                <div class="payment-actions">
                  <button class="pay-now-btn">Pay ₹${amount.toFixed(2)}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add payment confirmation listeners
      upiModal.querySelector('.pay-now-btn').onclick = async () => {
        // Show processing
        upiModal.innerHTML = `
          <div class="modal-content upi-content">
            <div class="modal-body">
              <div class="processing-message">
                <i class="fas fa-spinner fa-spin"></i>
                <h4>Processing Payment...</h4>
                <p>Please wait while we process your payment.</p>
              </div>
            </div>
          </div>
        `;

        // Simulate payment processing time
        setTimeout(async () => {
          // Simulate successful payment
          upiModal.innerHTML = `
            <div class="modal-content upi-content">
              <div class="modal-body">
                <div class="success-message">
                  <i class="fas fa-check-circle"></i>
                  <h4>Payment Successful!</h4>
                  <p>Your payment has been processed successfully.</p>
                  <button class="continue-btn">Continue</button>
                </div>
              </div>
            </div>
          `;

          // Add continue button listener
          upiModal.querySelector('.continue-btn').onclick = async () => {
            // Now process the actual payment on backend
            await processUPIPayment(upiId, amount, eventTitle);
            upiModal.remove();
          };
        }, 2000); // 2 second processing
      };

      // Cancel payment
      upiModal.querySelector('.cancel-payment-btn').onclick = () => {
        upiModal.innerHTML = `
          <div class="modal-content upi-content">
            <div class="modal-body">
              <div class="cancel-message">
                <i class="fas fa-times-circle"></i>
                <h4>Payment Cancelled</h4>
                <p>You have cancelled the payment.</p>
                <button class="back-to-apps-btn">Back to Payment Options</button>
              </div>
            </div>
          </div>
        `;

        // Back to apps button
        upiModal.querySelector('.back-to-apps-btn').onclick = () => {
          simulateUPIRedirect(upiId, amount, eventTitle);
        };
      };
    });
  });

  // Cancel button
  upiModal.querySelector('.cancel-btn').onclick = () => upiModal.remove();

  // Close modal when clicking outside
  upiModal.onclick = (e) => {
    if (e.target === upiModal) {
      upiModal.remove();
    }
  };
}

// Render organizer's events with management options
function renderMyEvents(events) {
  const myEventsList = document.getElementById('my-events-list');
  if (!myEventsList) return;

  if (!events.length) {
    myEventsList.innerHTML = '<p>You haven\'t created any events yet.</p>';
    return;
  }

  myEventsList.innerHTML = '';
  events.forEach(event => {
    const card = document.createElement('div');
    card.className = 'event-card organizer-event-card';

    const imageDiv = document.createElement('div');
    imageDiv.className = 'event-image';

    if (event.imageUrl) {
      const img = document.createElement('img');
      img.src = `http://localhost:5000${event.imageUrl}`;
      img.alt = event.title;
      imageDiv.appendChild(img);
    } else {
      imageDiv.innerHTML = '<i class="fas fa-calendar-day"></i>';
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'event-content';

    const title = document.createElement('h3');
    title.className = 'event-title';
    title.textContent = event.title;

    const date = document.createElement('p');
    date.className = 'event-date';
    date.textContent = new Date(event.date).toLocaleDateString();

    const location = document.createElement('p');
    location.className = 'event-location';
    location.textContent = event.location;

    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge ${event.status}`;
    statusBadge.textContent = event.status.charAt(0).toUpperCase() + event.status.slice(1);

    const description = document.createElement('p');
    description.className = 'event-description';
    description.textContent = event.description || '';

    // Add ticket types info
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      const ticketsInfo = document.createElement('p');
      ticketsInfo.className = 'event-tickets-info';
      ticketsInfo.textContent = `${event.ticketTypes.length} ticket type(s) available`;
      contentDiv.appendChild(ticketsInfo);
    }

    // Action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'event-actions';

    if (event.status === 'draft') {
      const publishBtn = document.createElement('button');
      publishBtn.className = 'publish-btn';
      publishBtn.textContent = 'Publish';
      publishBtn.onclick = () => publishEvent(event.id);
      actionsDiv.appendChild(publishBtn);
    }

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => editEvent(event.id);
    actionsDiv.appendChild(editBtn);

    contentDiv.appendChild(title);
    contentDiv.appendChild(date);
    contentDiv.appendChild(location);
    contentDiv.appendChild(statusBadge);
    contentDiv.appendChild(description);
    contentDiv.appendChild(actionsDiv);

    card.appendChild(imageDiv);
    card.appendChild(contentDiv);

    myEventsList.appendChild(card);
  });
}

// Publish an event
async function publishEvent(eventId) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${apiBaseUrl}/events/${eventId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'published' }),
    });

    if (!res.ok) throw new Error('Failed to publish event');

    alert('Event published successfully!');
    loadMyEvents(); // Refresh the organizer's events
    loadEvents(); // Refresh the public events list
  } catch (error) {
    console.error(error);
    alert('Failed to publish event. Please try again.');
  }
}

// Edit event (placeholder for future implementation)
function editEvent(eventId) {
  alert('Edit functionality will be implemented soon!');
}

// Process UPI payment after app simulation
async function processUPIPayment(upiId, amount, eventTitle) {
  try {
    // For demo purposes, we'll simulate the payment data
    // In a real app, this would come from the booking flow
    const token = localStorage.getItem('token');

    // Show success message
    alert('Payment completed successfully! Your tickets have been booked.');

    // Reload page to show updated state
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error('UPI Payment error:', error);
    alert('Payment failed. Please try again.');
  }
}

// Load user's bookings and tickets
async function loadMyBookings() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${apiBaseUrl}/bookings/my-bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch bookings');
    const bookings = await res.json();

    // Add bookings section if not exists
    let bookingsSection = document.getElementById('bookings-section');
    if (!bookingsSection && bookings.length > 0) {
      bookingsSection = document.createElement('div');
      bookingsSection.id = 'bookings-section';
      bookingsSection.innerHTML = `
        <div class="container">
          <h2 class="section-title">My Bookings</h2>
          <div id="my-bookings-list" class="bookings-grid"></div>
        </div>
      `;
      document.querySelector('main').appendChild(bookingsSection);
    }

    if (bookings.length > 0) {
      renderMyBookings(bookings);
    }
  } catch (error) {
    console.error(error);
  }
}

// Render user's bookings with ticket details
function renderMyBookings(bookings) {
  const myBookingsList = document.getElementById('my-bookings-list');
  if (!myBookingsList) return;

  if (!bookings.length) {
    myBookingsList.innerHTML = '<p>You haven\'t booked any tickets yet.</p>';
    return;
  }

  myBookingsList.innerHTML = '';
  bookings.forEach(booking => {
    const card = document.createElement('div');
    card.className = 'booking-card';

    const eventImage = booking.event.imageUrl ?
      `<img src="http://localhost:5000${booking.event.imageUrl}" alt="${booking.event.title}">` :
      '<i class="fas fa-calendar-day"></i>';

    const payment = booking.payment || {};
    const ticketNumber = payment.ticketNumber || 'N/A';
    const qrCodeImage = payment.qrCodeImage || '';

    card.innerHTML = `
      <div class="booking-header">
        <div class="event-image">
          ${eventImage}
        </div>
        <div class="booking-info">
          <h3>${booking.event.title}</h3>
          <p><i class="fas fa-calendar"></i> ${new Date(booking.event.date).toLocaleDateString()}</p>
          <p><i class="fas fa-map-marker-alt"></i> ${booking.event.location}</p>
          <p><i class="fas fa-ticket-alt"></i> ${booking.quantity} ticket(s)</p>
          <p><i class="fas fa-rupee-sign"></i> ${booking.totalAmount}</p>
        </div>
      </div>

      <div class="ticket-details">
        <div class="ticket-number">
          <h4>Ticket Number</h4>
          <div class="ticket-code">${ticketNumber}</div>
        </div>

        ${qrCodeImage ? `
          <div class="qr-code">
            <h4>QR Code</h4>
            <img src="${qrCodeImage}" alt="Ticket QR Code" class="qr-image">
          </div>
        ` : ''}

        <div class="booking-status">
          <span class="status-badge ${booking.status}">${booking.status}</span>
          ${payment.paymentStatus ? `<span class="payment-status ${payment.paymentStatus}">${payment.paymentStatus}</span>` : ''}
        </div>
      </div>

      <div class="booking-actions">
        <button class="download-bill-btn" onclick="downloadBill(${payment.id})">
          <i class="fas fa-download"></i> Download Bill
        </button>
        <button class="view-details-btn" onclick="viewBookingDetails(${booking.id})">
          <i class="fas fa-eye"></i> View Details
        </button>
      </div>
    `;

    myBookingsList.appendChild(card);
  });
}

// Download bill for a payment
function downloadBill(paymentId) {
  if (!paymentId) {
    alert('Payment ID not available');
    return;
  }

  const token = localStorage.getItem('token');
  const billUrl = `${apiBaseUrl}/payments/${paymentId}/bill`;

  // Create a temporary link to download the bill
  const link = document.createElement('a');
  link.href = billUrl;
  link.setAttribute('download', `bill-${paymentId}.html`);
  link.style.display = 'none';

  // Add authorization header for the request
  fetch(billUrl, {
    headers: { Authorization: `Bearer ${token}` },
  })
  .then(response => response.text())
  .then(html => {
    // Create a blob with the HTML content
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL
    URL.revokeObjectURL(url);
  })
  .catch(error => {
    console.error('Error downloading bill:', error);
    alert('Failed to download bill. Please try again.');
  });
}

// View detailed booking information
function viewBookingDetails(bookingId) {
  // This could open a modal with detailed booking information
  alert('Detailed booking view will be implemented soon!');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
  updateUIForLogin();

  // Load user's bookings if logged in
  if (isLoggedIn()) {
    loadMyBookings();
  }
});
