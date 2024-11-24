// app.js
const BASE_URL = 'https://lsdt-api-production.lasalledutemps.com';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJsc2R0X2FwcCIsInJvbGUiOiJ1c2VyIiwidXNlcl9pZCI6MzQ5NCwiaWF0IjoxNzMyNDUxMzM5fQ.pykIR3g6UJALDv0zTeQMm81xrFe_8FuEosrTvLBQ1bI'; // Replace with your token
const USER_ID = 3494;
const GYM_ID = 1;
const ACTIVITY = 'FULL-BODY';

let showPastDays = false; // Hide past days by default

// Toggle visibility of past days using the custom switch
document.getElementById('toggle-past').addEventListener('change', () => {
  showPastDays = document.getElementById('toggle-past').checked;
  renderCalendar();
});

// Open custom modal
function openModal(content, actions) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');
  const modalActions = document.getElementById('modal-actions');

  modalBody.innerHTML = content;

  // Make sure modalActions has the proper class for CSS styling
  modalActions.className = 'modal-actions';

  modalActions.innerHTML = ''; // Clear existing actions
  actions.forEach(action => {
    const button = document.createElement('button');
    button.innerText = action.label;
    button.onclick = action.onClick;
    button.ontouchend = action.onClick;
    button.className = action.className || ''; // Assign classes for styling buttons
    modalActions.appendChild(button);
  });

  modal.style.display = 'flex';
}

// Close modal when clicking outside the modal content
document.getElementById('modal').onclick = function (event) {
  if (event.target === this) {
    document.getElementById('modal').style.display = 'none';
  }
};

// Fetch appointments
async function fetchAppointments() {
  try {
    const response = await fetch(`${BASE_URL}/appointments/users/${USER_ID}/app`, {
      headers: {
        Authorization: AUTH_TOKEN,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Appointments API Response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return { next_appointments: [], past_appointments: [] };
  }
}

// Function to parse appointment date string (e.g., "lun. 25 nov.")
function parseAppointmentDate(dateString) {
  const [dayName, day, monthName] = dateString.split(' ');

  console.log(`Parsing appointment date: ${dateString}`); // Debugging

  const dayNumber = parseInt(day);
  const monthMap = {
    'janv.': 0,
    'févr.': 1,
    'mars': 2,
    'avr.': 3,
    'mai': 4,
    'juin': 5,
    'juil.': 6,
    'août': 7,
    'sept.': 8,
    'oct.': 9,
    'nov.': 10,
    'déc.': 11,
  };
  const month = monthMap[monthName];

  if (isNaN(dayNumber) || month === undefined) {
    console.error(`Failed to parse date: ${dateString}`); // Debugging
    return null;
  }

  const currentYear = new Date().getFullYear();
  return new Date(currentYear, month, dayNumber);
}

// Display the next appointment at the top of the page
function displayNextAppointment(nextAppointments) {
  const nextAppointmentText = document.getElementById('next-appointment-text');

  if (nextAppointments.length > 0) {
    // Sort appointments by date (convert to a Date object for comparison)
    nextAppointments.sort((a, b) => {
      const dateA = parseAppointmentDate(a.date);
      const dateB = parseAppointmentDate(b.date);
      return dateA - dateB;
    });

    const nextAppointment = nextAppointments[0];
    const appointmentDate = parseAppointmentDate(nextAppointment.date);

    if (appointmentDate) {
      const today = new Date();
      const dayDifference = Math.ceil((appointmentDate - today) / (1000 * 3600 * 24));

      let whenText;
      if (dayDifference === 1) {
        whenText = 'tomorrow';
      } else if (dayDifference === 2) {
        whenText = 'after-tomorrow';
      } else if (dayDifference > 2) {
        whenText = formatDateToMatchAPI(appointmentDate);
      } else {
        whenText = 'today';
      }

      nextAppointmentText.innerHTML = `😁<br>Your next appointment is<br>${whenText} at ${nextAppointment.hour}`;
    } else {
      nextAppointmentText.innerText = '😩<br>You have no upcoming appointments.';
    }
  } else {
    nextAppointmentText.innerText = 'You have no upcoming appointments.';
  }
}

// Format a date object to match the API's French date format (e.g., "lun. 2 déc.")
function formatDateToMatchAPI(date) {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// Check availability for a specific day
async function checkAvailability(date) {
  try {
    const response = await fetch(
      `${BASE_URL}/appointments/gyms/${GYM_ID}/dates/${date}/activities/${ACTIVITY}/users/${USER_ID}`,
      {
        headers: {
          Authorization: AUTH_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Availability for ${date}:`, data);
    return data;
  } catch (error) {
    console.error(`Error checking availability for ${date}:`, error);
    return [];
  }
}


// Render the calendar
async function renderCalendar() {
  const calendarContainer = document.getElementById('calendar');
  calendarContainer.innerHTML = ''; // Clear calendar

  const today = new Date();
  const dates = Array.from({ length: 35 }, (_, i) => {
    const date = new Date();
    date.setDate(today.getDate() - 14 + i);
    return date;
  });

  const appointments = await fetchAppointments();

  // Display next appointment message at the top
  displayNextAppointment(appointments.next_appointments);

  dates.forEach((date) => {
    const apiFormattedDate = formatDateToMatchAPI(date);
    const displayDate = formatDateToMatchAPI(date);
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('day', 'placeholder');

    // Create structured elements for weekday, day number, and month
    const weekdayDiv = document.createElement('div');
    weekdayDiv.classList.add('weekday');
    weekdayDiv.innerText = displayDate.split(' ')[0];

    const dayNumberDiv = document.createElement('div');
    dayNumberDiv.classList.add('day-number');
    dayNumberDiv.innerText = date.getDate();

    const monthDiv = document.createElement('div');
    monthDiv.classList.add('month');
    monthDiv.innerText = displayDate.split(' ')[2];

    // Append each part to the card
    dayDiv.appendChild(weekdayDiv);
    dayDiv.appendChild(dayNumberDiv);
    dayDiv.appendChild(monthDiv);

    if (date < today && !showPastDays) {
      dayDiv.style.display = 'none';
    } else if (date < today) {
      dayDiv.classList.add('past');
    }

    if (date.toDateString() === today.toDateString()) {
      dayDiv.classList.add('today'); // Highlight today
    }

    calendarContainer.appendChild(dayDiv);
    setTimeout(() => updateDayInfo(dayDiv, apiFormattedDate.toLowerCase(), date, appointments), 0);
  });
}

// Function to update day info based on appointments and availability
async function updateDayInfo(dayDiv, apiFormattedDate, dateObject, appointments) {
  const today = new Date();

  // Check past appointments
  const pastAppointment = appointments.past_appointments.find(
    (app) => app.date.toLowerCase() === apiFormattedDate
  );

  if (pastAppointment) {
    dayDiv.classList.remove('placeholder');
    dayDiv.classList.add('past-booked'); // Apply the new class for past booked days
    return;
  }

  // Check future booked appointments
  const nextAppointment = appointments.next_appointments.find(
    (app) => app.date.toLowerCase() === apiFormattedDate
  );

  if (nextAppointment) {
    dayDiv.classList.remove('placeholder');
    dayDiv.classList.add('booked');
    dayDiv.onclick = async () => {
      openModal(
        `You already have a booked appointment.`,
        [
          {
            label: 'Cancel the appointment',
            className: 'cancel',
            onClick: async () => {
              if (await cancelAppointment(nextAppointment.id)) {
                renderCalendar();
                document.getElementById('modal').style.display = 'none';
              }
            },
          },
        ]
      );
    };
    return;
  }

  // Check availability for future dates (only if date is today or in the future)
  if (dateObject >= today) {
    const formattedDateForAvailability = `${String(dateObject.getDate()).padStart(2, '0')}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${dateObject.getFullYear()}`;
    const availableSlots = await checkAvailability(formattedDateForAvailability);
    dayDiv.classList.remove('placeholder');

    if (availableSlots.includes('08:00')) {
      dayDiv.classList.add('available');
      dayDiv.onclick = async () => {
        openModal(
          `Do you want to book the slot?`,
          [
            {
              label: '08:00',
              className: 'book',
              onClick: async () => {
                if (await bookSlot(formattedDateForAvailability, '08:00')) {
                  renderCalendar();
                  document.getElementById('modal').style.display = 'none';
                }
              },
            },
          ]
        );
      };
    } else {
      dayDiv.classList.add('unavailable');
      dayDiv.onclick = async () => {
        if (availableSlots.length > 0) {
          openModal(
            `Available slots :`,
            availableSlots.map((slot) => ({
              label: `${slot}`,
              className: 'book',
              onClick: async () => {
                if (await bookSlot(formattedDateForAvailability, slot)) {
                  renderCalendar();
                  document.getElementById('modal').style.display = 'none';
                }
              },
            }))
          );
        } else {
          openModal(`No slots available.`, [
            {
              label: 'Close',
              className: 'close-button',
              onClick: () => {
                document.getElementById('modal').style.display = 'none';
              },
            },
          ]);
        }
      };
    }
  } else {
    dayDiv.classList.remove('placeholder');
    dayDiv.classList.add('unavailable');
  }
}

// Add to Google Calendar (Feature)
function addToGoogleCalendar(date, hour) {
  const [day, month, year] = date.split('-');
  const dateTimeStart = new Date(`${year}-${month}-${day}T${hour}:00`);

  // Add 45 minutes to the start time for the end time
  const dateTimeEnd = new Date(dateTimeStart.getTime() + 45 * 60000);

  // Formatting the start and end times in a format Google Calendar can understand
  const formatDateTimeForGoogle = (dateTime) =>
    dateTime.toISOString().replace(/-|:|\.\d{3}/g, '');

  const dateTimeStartFormatted = formatDateTimeForGoogle(dateTimeStart);
  const dateTimeEndFormatted = formatDateTimeForGoogle(dateTimeEnd);

  const googleCalendarURL = `https://www.google.com/calendar/render?action=TEMPLATE&text=LSDT&dates=${dateTimeStartFormatted}/${dateTimeEndFormatted}&details=La+Salle+Du+Temps+Booking`;

  window.open(googleCalendarURL, '_blank');
}

// Initialize the app
renderCalendar();
