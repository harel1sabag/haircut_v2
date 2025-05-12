const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// In-memory appointment store
const appointments = [];

// Get all appointments
app.get('/api/appointments', (req, res) => {
  res.json(appointments);
});

// Book an appointment
app.post('/api/appointments', (req, res) => {
  const { name, phone, date, time } = req.body;
  if (!name || !phone || !date || !time) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  // Check for slot taken
  if (appointments.some(appt => appt.date === date && appt.time === time)) {
    return res.status(409).json({ error: 'Slot already booked' });
  }
  appointments.push({ name, phone, date, time });
  res.status(201).json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
