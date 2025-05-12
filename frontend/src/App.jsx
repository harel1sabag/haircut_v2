import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, Snackbar, Alert, Avatar } from '@mui/material';
import BookingForm from './BookingForm';
import { auth, provider, signInWithPopup, signOut } from './firebase';

export default function App() {
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      alert('שגיאה בהתחברות: ' + e.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Heebo' }}>
        <Box sx={{ width: '100%', textAlign: 'center', bgcolor: '#fff', p: 5, borderRadius: 4, boxShadow: 6, border: '1px solid #90caf9' }}>
          <Avatar sx={{ bgcolor: '#1976d2', width: 80, height: 80, mx: 'auto', mb: 3 }} src="https://fonts.gstatic.com/s/i/materialiconsoutlined/content_cut/v16/24px.svg" />
          <Typography variant="h4" sx={{ color: '#1565c0', mb: 2, fontWeight: 700 }}>כניסה לאתר</Typography>
          <Button
            onClick={handleLogin}
            variant="contained"
            color="primary"
            size="large"
            sx={{ fontWeight: 700, fontSize: 20, borderRadius: 3, px: 6, py: 2, boxShadow: 2 }}
          >
            התחבר עם גוגל
          </Button>
        </Box>
      </Container>
    );
  }

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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar src={user.photoURL} alt={user.displayName} sx={{ width: 40, height: 40, ml: 1 }} />
            <Typography sx={{ color: '#1565c0', fontWeight: 700 }}>{user.displayName}</Typography>
            <Button onClick={handleLogout} color="secondary" sx={{ ml: 2 }}>התנתק</Button>
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
