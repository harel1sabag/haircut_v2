import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, CircularProgress, Box, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

export default function AdminPanel() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'appointments'));
        setAppointments(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      } catch (e) {
        setError('שגיאה בטעינת התורים: ' + e.message);
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('האם למחוק את התור?')) return;
    try {
      await deleteDoc(doc(db, 'appointments', id));
      setAppointments(appointments.filter(a => a.id !== id));
    } catch (e) {
      setError('שגיאה במחיקה: ' + e.message);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>;

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          onClick={() => signOut(auth)}
          sx={{
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
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, textAlign: 'center', color: '#1565c0' }}>
        כל התורים שנקבעו
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="right">שם</TableCell>
              <TableCell align="right">טלפון</TableCell>
              <TableCell align="right">תאריך</TableCell>
              <TableCell align="right">שעה</TableCell>
              <TableCell align="right">אימייל</TableCell>
              <TableCell align="right">מחיקה</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map(row => (
              <TableRow key={row.id}>
                <TableCell align="right">{row.name}</TableCell>
                <TableCell align="right">{row.phone}</TableCell>
                <TableCell align="right">{row.date}</TableCell>
                <TableCell align="right">{row.time}</TableCell>
                <TableCell align="right">{row.email}</TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => handleDelete(row.id)} size="small">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
