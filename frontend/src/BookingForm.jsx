import React, { useState } from 'react';
import { Box, TextField, Button, MenuItem, Typography, Alert } from '@mui/material';

const times = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

export default function BookingForm({ onSuccess }) {
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.status === 201) {
        onSuccess();
        setForm({ name: '', phone: '', date: '', time: '' });
      } else {
        const data = await res.json();
        setError(data.error || 'שגיאה בקביעת התור');
      }
    } catch {
      setError('שגיאת רשת');
    }
    setLoading(false);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        bgcolor: 'rgba(44,44,44,0.98)',
        borderRadius: 4,
        boxShadow: 6,
        p: { xs: 3, sm: 4 },
        direction: 'rtl',
        color: 'white',
        fontFamily: 'Heebo, Arial, sans-serif',
        textAlign: 'right',
      }}
    >
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#fff', mb: 3 }}>
        פרטי הזמנה
      </Typography>
      <TextField
        label="שם מלא"
        name="name"
        value={form.name}
        onChange={handleChange}
        fullWidth
        required
        sx={{ mb: 3, input: { color: '#fff', fontFamily: 'Heebo' }, label: { color: '#b0bec5' } }}
        InputLabelProps={{ style: { right: 0, left: 'unset', color: '#b0bec5' }, shrink: true }}
        inputProps={{ style: { textAlign: 'right' } }}
      />
      <TextField
        label="טלפון"
        name="phone"
        value={form.phone}
        onChange={handleChange}
        fullWidth
        required
        sx={{ mb: 3, input: { color: '#fff', fontFamily: 'Heebo' }, label: { color: '#b0bec5' } }}
        InputLabelProps={{ style: { right: 0, left: 'unset', color: '#b0bec5' }, shrink: true }}
        inputProps={{ style: { textAlign: 'right' } }}
      />
      <TextField
        label="תאריך"
        name="date"
        type="date"
        value={form.date}
        onChange={handleChange}
        fullWidth
        required
        sx={{ mb: 3, input: { color: '#fff', fontFamily: 'Heebo' }, label: { color: '#b0bec5' } }}
        InputLabelProps={{ style: { right: 0, left: 'unset', color: '#b0bec5' }, shrink: true }}
        inputProps={{ style: { textAlign: 'right' } }}
      />
      <TextField
        select
        label="שעה"
        name="time"
        value={form.time}
        onChange={handleChange}
        fullWidth
        required
        sx={{ mb: 3, input: { color: '#fff', fontFamily: 'Heebo' }, label: { color: '#b0bec5' } }}
        InputLabelProps={{ style: { right: 0, left: 'unset', color: '#b0bec5' }, shrink: true }}
        inputProps={{ style: { textAlign: 'right' } }}
      >
        {times.map((t) => (
          <MenuItem key={t} value={t} sx={{ textAlign: 'right', fontFamily: 'Heebo' }}>{t}</MenuItem>
        ))}
      </TextField>
      {error && <Alert severity="error" sx={{ mb: 3, fontFamily: 'Heebo' }}>{error}</Alert>}
      <Button
        type="submit"
        variant="contained"
        color="secondary"
        fullWidth
        disabled={loading}
        sx={{
          mt: 1,
          fontWeight: 700,
          fontSize: 18,
          borderRadius: 3,
          boxShadow: 2,
          bgcolor: '#607d8b',
          color: '#fff',
          '&:hover': { bgcolor: '#78909c' },
          fontFamily: 'Heebo',
        }}
      >
        {loading ? 'שולח...' : 'קבע תור'}
      </Button>
    </Box>
  );
}
