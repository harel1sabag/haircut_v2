import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Box, Typography, Button, Switch, TextField, Grid, Paper, CircularProgress, Alert } from '@mui/material';

const days = [
  { key: 'sunday', label: 'ראשון' },
  { key: 'monday', label: 'שני' },
  { key: 'tuesday', label: 'שלישי' },
  { key: 'wednesday', label: 'רביעי' },
  { key: 'thursday', label: 'חמישי' },
  { key: 'friday', label: 'שישי' },
  { key: 'saturday', label: 'שבת' },
];

export default function WorkingHoursAdmin() {
  const [hours, setHours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchHours = async () => {
      try {
        const ref = doc(db, 'settings', 'working_hours');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setHours(snap.data());
        } else {
          // ברירת מחדל
          setHours({
            sunday:   { open: true,  from: '09:00', to: '18:00' },
            monday:   { open: true,  from: '09:00', to: '18:00' },
            tuesday:  { open: true,  from: '09:00', to: '18:00' },
            wednesday:{ open: true,  from: '09:00', to: '18:00' },
            thursday: { open: true,  from: '09:00', to: '18:00' },
            friday:   { open: true,  from: '09:00', to: '14:00' },
            saturday: { open: false, from: '',      to: ''      },
          });
        }
      } catch (e) {
        setError('שגיאה בטעינת שעות פעילות: ' + e.message);
      }
      setLoading(false);
    };
    fetchHours();
  }, []);

  const handleChange = (day, field, value) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const ref = doc(db, 'settings', 'working_hours');
      await setDoc(ref, hours);
      setSuccess(true);
    } catch (e) {
      setError('שגיאה בשמירה: ' + e.message);
    }
    setSaving(false);
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Paper sx={{ p: 3, maxWidth: 600, margin: '24px auto', boxShadow: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>ניהול שעות פעילות</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>ההגדרות נשמרו בהצלחה!</Alert>}
      <Grid container spacing={2}>
        {days.map(day => (
          <React.Fragment key={day.key}>
            <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography>{day.label}</Typography>
            </Grid>
            <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Switch
                checked={hours[day.key]?.open || false}
                onChange={e => handleChange(day.key, 'open', e.target.checked)}
                color="success"
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="משעה"
                type="time"
                size="small"
                value={hours[day.key]?.from || ''}
                onChange={e => handleChange(day.key, 'from', e.target.value)}
                disabled={!hours[day.key]?.open}
                fullWidth
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="עד שעה"
                type="time"
                size="small"
                value={hours[day.key]?.to || ''}
                onChange={e => handleChange(day.key, 'to', e.target.value)}
                disabled={!hours[day.key]?.open}
                fullWidth
              />
            </Grid>
          </React.Fragment>
        ))}
      </Grid>
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 3, fontWeight: 700, minWidth: 120 }}
        onClick={handleSave}
        disabled={saving}
      >
        שמור
      </Button>
    </Paper>
  );
}
