const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'appointments.db');
const db = new sqlite3.Database(dbPath);

// Create the appointments table if it doesn't exist
const init = () => {
  db.run(`CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL
  )`);
};

// Get all appointments
const getAppointments = (cb) => {
  db.all('SELECT * FROM appointments', [], cb);
};

// Add an appointment
const addAppointment = (name, phone, date, time, cb) => {
  db.run(
    'INSERT INTO appointments (name, phone, date, time) VALUES (?, ?, ?, ?)',
    [name, phone, date, time],
    cb
  );
};

// Check if slot is taken
const isSlotTaken = (date, time, cb) => {
  db.get(
    'SELECT 1 FROM appointments WHERE date = ? AND time = ?',
    [date, time],
    (err, row) => cb(err, !!row)
  );
};

module.exports = {
  init,
  getAppointments,
  addAppointment,
  isSlotTaken,
};
