const express = require('express');
const cors = require('cors');
const db = require('./db');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

db.init();

// Get all appointments
app.get('/api/appointments', (req, res) => {
  db.getAppointments((err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

// Book an appointment
app.post('/api/appointments', (req, res) => {
  const { name, phone, date, time } = req.body;
  if (!name || !phone || !date || !time) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  db.isSlotTaken(date, time, (err, taken) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (taken) return res.status(409).json({ error: 'Slot already booked' });
    db.addAppointment(name, phone, date, time, (err2) => {
      if (err2) return res.status(500).json({ error: 'DB error' });
      res.status(201).json({ success: true });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
