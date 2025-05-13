import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, Box } from '@mui/material';

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
        setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      } catch (e) {
        setError('שגיאה בטעינת היסטוריית התורים: ' + e.message);
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [user]);

  if (!user) return null;

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2', mb: 2 }}>
        היסטוריית תורים
      </Typography>
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
                  <TableCell>{app.date}</TableCell>
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
