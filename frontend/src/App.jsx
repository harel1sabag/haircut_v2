import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, Snackbar, Alert, Avatar } from '@mui/material';
import BookingForm from './BookingForm';
import AdminPanel from './AdminPanel';
import { isAdmin } from './firebase';
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
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // הוסף את המשתמש ל-Firestore אם לא קיים
       const { doc, getDoc, setDoc, updateDoc } = await import('firebase/firestore');
       const { db } = await import('./firebase');

       const userRef = doc(db, 'users', user.uid);
       const userSnap = await getDoc(userRef);
       if (!userSnap.exists()) {
         await setDoc(userRef, {
           uid: user.uid,
           email: user.email,
           displayName: user.displayName || '',
           creationTime: user.metadata.creationTime,
           lastSignInTime: user.metadata.lastSignInTime,
         });
       } else {
         // עדכן כניסה אחרונה
         await updateDoc(userRef, {
           lastSignInTime: user.metadata.lastSignInTime,
         });
       }
      setShowForm(true); // פתח אוטומטית את טופס קביעת התור
    } catch (e) {
      alert('שגיאה בהתחברות: ' + e.message);
    }
  };

  // אם יש משתמש מחובר, עבור אוטומטית לטופס קביעת התור
  useEffect(() => {
    if (user) {
      setShowForm(true);
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Heebo' }}>
        <Box sx={{ width: '100%', textAlign: 'center', bgcolor: '#fff', p: 5, borderRadius: 4, boxShadow: 6, border: '1px solid #90caf9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Avatar sx={{ bgcolor: '#1976d2', width: 80, height: 80, mx: 'auto', mb: 3 }} src="https://fonts.gstatic.com/s/i/materialiconsoutlined/content_cut/v16/24px.svg" />
          <Typography variant="h4" sx={{ color: '#1565c0', mb: 2, fontWeight: 700 }}>כניסה לאתר</Typography>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              onClick={handleLogin}
              variant="contained"
              color="primary"
              size="large"
              sx={{ fontWeight: 700, fontSize: 20, borderRadius: 3, px: 6, py: 2, boxShadow: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" style={{ marginLeft: 8 }}><g><path fill="#4285F4" d="M21.805 10.023h-9.765v3.995h5.633c-.242 1.254-1.449 3.682-5.633 3.682-3.385 0-6.141-2.8-6.141-6.25s2.756-6.25 6.141-6.25c1.928 0 3.225.819 3.969 1.527l2.717-2.636c-1.697-1.584-3.891-2.563-6.686-2.563-5.523 0-10 4.477-10 10s4.477 10 10 10c5.729 0 9.521-4.021 9.521-9.682 0-.651-.07-1.149-.156-1.5z"/><path fill="#34A853" d="M12.04 22c2.62 0 4.807-.864 6.409-2.345l-3.053-2.497c-.844.569-1.922.963-3.356.963-2.58 0-4.773-1.742-5.561-4.088l-3.081 2.389c1.587 3.163 5.009 5.578 9.642 5.578z"/><path fill="#FBBC05" d="M6.479 13.033c-.227-.682-.358-1.409-.358-2.033s.131-1.352.358-2.033l-3.088-2.389c-.627 1.254-.991 2.654-.991 4.422s.364 3.168.991 4.422l3.088-2.389z"/><path fill="#EA4335" d="M12.04 7.579c1.429 0 2.396.616 2.949 1.132l2.205-2.15c-1.268-1.181-2.909-1.899-5.154-1.899-3.195 0-5.908 2.117-6.886 4.963l3.088 2.389c.788-2.346 2.981-4.088 5.561-4.088z"/></g></svg>
              התחבר עם גוגל
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }
  // אם אדמין, הצג לוח ניהול
  if (user && isAdmin(user.email)) {
    return <AdminPanel />;
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
          <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 120, mb: 2 }}>
            <Avatar
              sx={{ bgcolor: '#1976d2', width: 80, height: 80, ml: 3 }}
              src="https://fonts.gstatic.com/s/i/materialiconsoutlined/content_cut/v16/24px.svg"
              alt="Barber"
            />
            <Box>
              <Typography variant="h3" fontWeight={700} gutterBottom sx={{ fontFamily: 'Heebo', color: '#1565c0', mb: 0, fontSize: { xs: 28, sm: 38 } }}>
                קביעת תורים לתספורת
              </Typography>
              
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar src={user.photoURL} alt={user.displayName} sx={{ width: 40, height: 40, ml: 1 }} />
            <Typography sx={{ color: '#1565c0', fontWeight: 700 }}>{user.displayName}</Typography>
            <Button
  onClick={handleLogout}
  sx={{
    ml: 2,
    backgroundColor: '#e53935',
    color: '#fff',
    fontWeight: 700,
    borderRadius: 3,
    px: 3,
    py: 1,
    fontSize: 18,
    boxShadow: 2,
    '&:hover': {
      backgroundColor: '#b71c1c',
      color: '#fff',
    },
  }}
  variant="contained"
>
  התנתק
</Button>
          </Box>
        </Box>
        
        {showForm && (
          <Box sx={{ mt: 4 }}>
            <BookingForm onSuccess={() => { setSuccess(true); setShowForm(false); }} user={user} />
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
