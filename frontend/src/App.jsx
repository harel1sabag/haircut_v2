import React, { useState } from 'react';
import { Container, Typography, Button, Box, Snackbar, Alert, Avatar } from '@mui/material';
import BookingForm from './BookingForm';

export default function App() {
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8, fontFamily: 'Heebo, Arial, sans-serif' }}>
      <Box
        sx={{
          bgcolor: '#fff',
          borderRadius: 4,
          boxShadow: 6,
          p: { xs: 3, sm: 5 },
          textAlign: 'right',
          direction: 'rtl',
          color: '#1a237e',
          position: 'relative',
          border: '1px solid #90caf9',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{ bgcolor: '#1976d2', width: 64, height: 64, ml: 2 }}
            src="https://fonts.gstatic.com/s/i/materialiconsoutlined/content_cut/v16/24px.svg"
            alt="Barber"
          />
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom sx={{ fontFamily: 'Heebo', color: '#1565c0', mb: 0 }}>
              ספר - קביעת תור
            </Typography>
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 400 }}>
              ברוכים הבאים לספר! הזמינו תור אונליין במהירות ובקלות.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => setShowForm(true)}
          sx={{ mt: 2, fontWeight: 700, fontSize: 18, borderRadius: 3, boxShadow: 2 }}
        >
          קבע תור
        </Button>
        {showForm && (
          <Box sx={{ mt: 4 }}>
            <BookingForm onSuccess={() => { setSuccess(true); setShowForm(false); }} />
          </Box>
        )}
        <Snackbar open={success} autoHideDuration={4000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="success" sx={{ width: '100%' }}>
            התור נקבע בהצלחה!
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}
