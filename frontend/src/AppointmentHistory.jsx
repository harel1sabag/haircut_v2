import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, Box, Button } from '@mui/material';

import { auth } from './firebase';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

export default function AppointmentHistory({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchAppointments = async () => {
      try {
        let q;
        if (user.email) {
          q = query(
            collection(db, 'appointments'),
            where('email', '==', user.email),
            orderBy('date', 'desc'),
            orderBy('time', 'desc')
          );
        } else if (user.uid) {
          q = query(
            collection(db, 'appointments'),
            where('uid', '==', user.uid),
            orderBy('date', 'desc'),
            orderBy('time', 'desc')
          );
        } else {
          setAppointments([]);
          setLoading(false);
          return;
        }
        const snapshot = await getDocs(q);
        // סנן החוצה תורים שבוצעו
        const allAppointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAppointments(allAppointments.filter(app => !app.done));
        setLoading(false);
      } catch (e) {
        // טיפול בשגיאת אינדקס של Firestore
        if (e && typeof e.message === 'string' && e.message.toLowerCase().includes('index')) {
          setError('יש ליצור אינדקס ב-Firebase כדי להציג את היסטוריית התורים. יש להיכנס ל-Firebase Console, ללחוץ על הקישור שנוצר בשגיאה, וליצור את האינדקס.');
        } else {
          setError('שגיאה בטעינת היסטוריית התורים: ' + e.message);
        }
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [user]);

  if (!user) return null;

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>
          היסטוריית תורים
        </Typography>
        {user && (
          <Button
            variant="contained"
            color="error"
            fullWidth
            size="large"
            startIcon={<ExitToAppIcon />}
            onClick={() => auth.signOut()}
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              py: 1.5,
              fontSize: { xs: 16, sm: 18 },
              boxShadow: 2,
              mt: 1
            }}
          >
            התנתק
          </Button>
        )}
      </Box>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : appointments.length === 0 ? (
        <Typography>לא נמצאו תורים קודמים.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>תאריך</TableCell>
                <TableCell>שעה</TableCell>
                <TableCell>שם</TableCell>
                <TableCell>טלפון</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map(app => (
                <TableRow key={app.id}>
                  <TableCell>{app.date ? new Date(app.date).toLocaleDateString('he-IL', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''}</TableCell>
                  <TableCell>{app.time}</TableCell>
                  <TableCell>{app.name}</TableCell>
                  <TableCell>{app.phone}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
