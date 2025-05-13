import React, { useState } from 'react';
import { Box, TextField, Button, MenuItem, Typography, Alert } from '@mui/material';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

const times = [
  '15:00', '16:00', '17:00', '18:00', '19:00',
];

export default function BookingForm({ onSuccess, user }) {
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const validateName = (name) => {
    if (!name) return 'יש להזין שם';
    if (!/^[א-ת\s]+$/.test(name)) return 'השם חייב להיות בעברית בלבד';
    return '';
  };
  const validatePhone = (phone) => {
    if (!phone) return '';
    if (!/^05\d{8}$/.test(phone)) return 'מספר טלפון לא תקין';
    return '';
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'name') setNameError(validateName(e.target.value));
    if (e.target.name === 'phone') setPhoneError(validatePhone(e.target.value));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setNameError(validateName(form.name));
    setPhoneError(validatePhone(form.phone));
    // date validation: must be between today and two weeks ahead
    const today = new Date();
    const minDateObj = new Date(Date.now() + 24*60*60*1000); // מחר
    const minDate = minDateObj.toISOString().split('T')[0];
    const maxDate = new Date(Date.now() + 13*24*60*60*1000).toISOString().split('T')[0];
    if (form.date < minDate || form.date > maxDate) {
      setError('ניתן לקבוע תור רק מחר ועד שבועיים קדימה');
      setLoading(false);
      return;
    }
    if (validateName(form.name) || validatePhone(form.phone)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // בדיקה אם יש כבר תור למשתמש
      const q = user?.email
        ? ["email", "==", user.email]
        : ["name", "==", form.name];
      const { getDocs, query, collection, where, and } = await import('firebase/firestore');
      const appointmentsRef = collection(db, "appointments");
      // בדיקה לפי משתמש
      const existingQuery = query(appointmentsRef, where(q[0], q[1], q[2]));
      const snapshot = await getDocs(existingQuery);
      if (!snapshot.empty) {
        setError('כבר קבעת תור. לא ניתן לקבוע יותר מאחד.');
        setLoading(false);
        return;
      }
      // בדיקה אם התור תפוס בתאריך ושעה
      const dateTimeQuery = query(
        appointmentsRef,
        where('date', '==', form.date),
        where('time', '==', form.time)
      );
      const dateTimeSnapshot = await getDocs(dateTimeQuery);
      if (!dateTimeSnapshot.empty) {
        setError('התור שבחרת כבר תפוס. אנא בחר שעה אחרת.');
        setLoading(false);
        return;
      }
      await addDoc(collection(db, "appointments"), {
        ...form,
        email: user?.email || '',
        uid: user?.uid || '',
      });
      setLoading(false);
      setForm({ name: '', phone: '', date: '', time: '' });
      onSuccess && onSuccess();
    } catch (e) {
      setError('שגיאה בשליחת הטופס: ' + e.message);
      setLoading(false);
    }
    setLoading(false);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        bgcolor: '#f5fafd',
        borderRadius: 6,
        boxShadow: 8,
        p: { xs: 4, sm: 6 },
        direction: 'rtl',
        color: '#1565c0',
        fontFamily: 'Heebo, Arial, sans-serif',
        textAlign: 'right',
        border: '1px solid #90caf9',
        maxWidth: 480,
        mx: 'auto',
        mt: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Typography variant="h4" fontWeight={900} gutterBottom sx={{ color: '#1565c0', mb: 4, textAlign: 'center', letterSpacing: 1 }}>
        פרטי הזמנה
      </Typography>
      <TextField
        label="שם מלא"
        name="name"
        value={form.name}
        onChange={handleChange}
        fullWidth
        required
        error={!!nameError}
        helperText={nameError}
        sx={{ mb: 2, bgcolor: '#fff', borderRadius: 2, input: { fontFamily: 'Heebo' }, label: { color: '#1976d2' } }}
        InputLabelProps={{ style: { right: 0, left: 'unset', color: '#1976d2' }, shrink: true }}
        inputProps={{ style: { textAlign: 'right' } }}
      />
      <TextField
        label="טלפון (לא חובה)"
        name="phone"
        value={form.phone}
        onChange={handleChange}
        fullWidth
        error={!!phoneError}
        helperText={phoneError}
        sx={{ mb: 2, bgcolor: '#fff', borderRadius: 2, input: { fontFamily: 'Heebo' }, label: { color: '#1976d2' } }}
        InputLabelProps={{ style: { right: 0, left: 'unset', color: '#1976d2' }, shrink: true }}
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
        sx={{ mb: 1, bgcolor: '#fff', borderRadius: 2, input: { fontFamily: 'Heebo' }, label: { color: '#1976d2' } }}
        InputLabelProps={{ style: { right: 0, left: 'unset', color: '#1976d2' }, shrink: true }}
        inputProps={{ 
          style: { textAlign: 'right' },
          min: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
          max: new Date(Date.now() + 13*24*60*60*1000).toISOString().split('T')[0],
        }}
      />
      
      <TextField
        select
        label="שעה"
        name="time"
        value={form.time}
        onChange={handleChange}
        fullWidth
        required
        sx={{ mb: 2, bgcolor: '#fff', borderRadius: 2, input: { fontFamily: 'Heebo' }, label: { color: '#1976d2' } }}
        InputLabelProps={{ style: { right: 0, left: 'unset', color: '#1976d2' }, shrink: true }}
        inputProps={{ style: { textAlign: 'right' } }}
      >
        {times.map((t) => (
          <MenuItem key={t} value={t} sx={{ textAlign: 'right', fontFamily: 'Heebo' }}>{t}</MenuItem>
        ))}
      </TextField>
      {error && <Alert severity="error" sx={{ mb: 4, fontFamily: 'Heebo' }}>{error}</Alert>}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading}
        sx={{
          mt: 2,
          fontWeight: 900,
          fontSize: 22,
          borderRadius: 4,
          boxShadow: 4,
          bgcolor: '#1976d2',
          color: '#fff',
          py: 2,
          letterSpacing: 1,
          '&:hover': { bgcolor: '#1565c0' },
        }}
      >
        {loading ? 'שולח...' : 'קבע תור'}
      </Button>
    </Box>
  );
}
