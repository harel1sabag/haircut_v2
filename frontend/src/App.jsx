import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Snackbar, 
  Alert, 
  Avatar, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  useMediaQuery,
  useTheme,
  ThemeProvider,
  CssBaseline,
  Paper
} from '@mui/material';
import {
  Menu as MenuIcon,
  ExitToApp as ExitToAppIcon,
  Home as HomeIcon,
  History as HistoryIcon,
  ContentCut as ContentCutIcon
} from '@mui/icons-material';
import BookingForm from './BookingForm';

import AdminPanel from './AdminPanel';
import AppointmentHistory from './AppointmentHistory';
import { isAdmin } from './firebase';
import { auth, provider, signInWithPopup, signOut } from './firebase';
import theme from './styles';

export default function App() {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('form'); // 'form' or 'history'
  const [hasActiveAppointment, setHasActiveAppointment] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  
  // נעקוב אחרי התור הפעיל באמצעות useEffect
  useEffect(() => {
    async function checkActiveAppointment() {
      try {
        console.log('[App] checkActiveAppointment: user:', user);
        if (!user?.email) return;
        const { getDocs, query, collection, where } = await import('firebase/firestore');
        const { db } = await import('./firebase');
        const appointmentsRef = collection(db, "appointments");
        const q = query(appointmentsRef, where("email", "==", user.email));
        const snapshot = await getDocs(q);
        const futureAppointments = snapshot.docs
          .map(doc => ({ ...doc.data(), id: doc.id }))
          .filter(app => !app.done);
        console.log('[App] futureAppointments:', futureAppointments);
        if (futureAppointments.length > 0) {
          setHasActiveAppointment(true);
          setActiveAppointment(futureAppointments[0]);
        } else {
          setHasActiveAppointment(false);
          setActiveAppointment(null);
        }
      } catch (err) {
        console.error('[App] Error in checkActiveAppointment:', err);
      }
    }
    checkActiveAppointment();
  }, [user]);
  
  useEffect(() => {
    try {
      console.log('[App] useEffect: subscribing to auth.onAuthStateChanged');
      const unsubscribe = auth.onAuthStateChanged(u => {
        console.log('[App] onAuthStateChanged:', u);
        setUser(u);
      });
      return () => {
        console.log('[App] useEffect: unsubscribing from auth.onAuthStateChanged');
        unsubscribe();
      };
    } catch (err) {
      console.error('[App] Error in useEffect (auth listener):', err);
    }
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
      setShowHistory(false);
      setActiveView('form');
    } else {
      setShowForm(false);
      setShowHistory(false);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowForm(false);
      setShowHistory(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigation = (view) => {
    setActiveView(view);
    if (view === 'form') {
      setShowForm(true);
      setShowHistory(false);
    } else if (view === 'history') {
      setShowForm(false);
      setShowHistory(true);
    }
  };

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="sm" sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: { xs: 2, sm: 3 } 
        }}>
          <Box sx={{ 
            width: '100%', 
            textAlign: 'center', 
            bgcolor: 'background.paper', 
            p: { xs: 3, sm: 5 }, 
            borderRadius: 4, 
            boxShadow: 3, 
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main', 
                width: { xs: 64, sm: 80 }, 
                height: { xs: 64, sm: 80 }, 
                mx: 'auto', 
                mb: 3 
              }} 
              src="https://fonts.gstatic.com/s/i/materialiconsoutlined/content_cut/v16/24px.svg" 
            />
            <Typography variant="h4" sx={{ color: 'primary.dark', mb: 2, fontWeight: 700 }}>
              כניסה לאתר
            </Typography>
            <Box sx={{ width: '100%', mt: 2 }}>
              <Button
                fullWidth
                onClick={handleLogin}
                variant="contained"
                color="primary"
                size="large"
                sx={{ 
                  fontWeight: 700, 
                  fontSize: { xs: 16, sm: 20 },
                  py: { xs: 1.5, sm: 2 },
                  boxShadow: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <g>
                    <path fill="#fff" d="M21.805 10.023h-9.765v3.995h5.633c-.242 1.254-1.449 3.682-5.633 3.682-3.385 0-6.141-2.8-6.141-6.25s2.756-6.25 6.141-6.25c1.928 0 3.225.819 3.969 1.527l2.717-2.636c-1.697-1.584-3.891-2.563-6.686-2.563-5.523 0-10 4.477-10 10s4.477 10 10 10c5.729 0 9.521-4.021 9.521-9.682 0-.651-.07-1.149-.156-1.5z"/>
                  </g>
                </svg>
                התחבר עם גוגל
              </Button>
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }
  // אם אדמין, הצג לוח ניהול
  if (user && isAdmin(user.email)) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex' }}>
          <Box component="main" sx={{ flexGrow: 1, p: 3, pt: { xs: 8, sm: 10 } }}>
            <AdminPanel />
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  // משתמש רגיל - הצג את ממשק המשתמש הרגיל
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ minHeight: '100vh', fontFamily: 'Heebo', py: 4 }}>
        {!hasActiveAppointment ? (
          <BookingForm user={user} onSuccess={() => setSuccess(true)} />
        ) : activeAppointment ? (
          <Box sx={{ mt: 4, mb: 4 }}>
            <Alert severity="error" sx={{ fontWeight: 700, mb: 2 }}>
              כבר קבעת תור. לא ניתן לקבוע יותר מאחד.
            </Alert>
            <Paper sx={{ p: 3, bgcolor: '#fffde7', borderRadius: 3, boxShadow: 2, mb: 2 }}>
              <Typography sx={{ fontWeight: 700 }}>
                <span>תאריך: </span>{activeAppointment.date || ''}
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                <span>שעה: </span>{activeAppointment.time || ''}
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                <span>שם: </span>{activeAppointment.name || ''}
              </Typography>
              {activeAppointment.phone && (
                <Typography sx={{ fontWeight: 700 }}>
                  <span>טלפון: </span>{activeAppointment.phone}
                </Typography>
              )}
              <Button
                variant="outlined"
                color="error"
                fullWidth
                sx={{ mt: 2, fontWeight: 700 }}
                onClick={handleLogout}
              >
                התנתק
              </Button>
            </Paper>
          </Box>
        ) : null}
        <AppointmentHistory user={user} />
      </Container>
    </ThemeProvider>
  );
}
