import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import WorkingHoursAdmin from './WorkingHoursAdmin';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, CircularProgress, Box, Button } from '@mui/material';
import { collection as fsCollection, getDocs as fsGetDocs } from 'firebase/firestore';
import DeleteIcon from '@mui/icons-material/Delete';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

function formatHebrewDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d)) return '-';
  return d.toLocaleDateString('he-IL');
}

export default function AdminPanel() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);

  useEffect(() => {
    const fetchCompletedAppointments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'completed_appointments'));
        setCompletedAppointments(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        setError('שגיאה בטעינת תורים שבוצעו: ' + e.message);
      }
    };
    fetchCompletedAppointments();
  }, []);

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
    const fetchUsers = async () => {
      try {
        const querySnapshot = await fsGetDocs(fsCollection(db, 'users'));
        setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        setError('שגיאה בטעינת המשתמשים: ' + e.message);
      }
    };
    fetchAppointments();
    fetchUsers();
  }, []);

  const handleDeleteCompleted = async (id) => {
    if (!window.confirm('האם למחוק את התור שבוצע?')) return;
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'completed_appointments', id));
      setCompletedAppointments(apps => apps.filter(a => a.id !== id));
    } catch (e) {
      setError('שגיאה במחיקת תור שבוצע: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('האם למחוק את התור?')) return;
    try {
      const { doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'appointments', id));
      setAppointments(appointments.filter(a => a.id !== id));
    } catch (e) {
      setError('שגיאה במחיקה: ' + e.message);
    }
  };

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const doneLastWeek = completedAppointments.filter(a => a.completedAt && new Date(a.completedAt) >= weekAgo);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>;

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <WorkingHoursAdmin />
      <Box sx={{ height: 32 }} />
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
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 200, maxWidth: 300 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, textAlign: 'center', color: '#1976d2', fontSize: 18 }}>
            משתמשים
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="right">שם</TableCell>
                  <TableCell align="right">אימייל</TableCell>
                  <TableCell align="right">נוצר בתאריך</TableCell>
                  <TableCell align="right">כניסה אחרונה</TableCell>
                  <TableCell align="right">כמות תורים שבוצעו</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: '#888' }}>
                      אין משתמשים
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map(user => {
                    // חישוב כמות תורים שבוצעו לפי אימייל
                    const userAppointments = completedAppointments.filter(app => app.email === user.email);
                    return (
                      <TableRow key={user.id}>
                        <TableCell align="right">{user.displayName || user.name || '-'}</TableCell>
                        <TableCell align="right">{user.email || '-'}</TableCell>
                        <TableCell align="right">{user.creationTime ? new Date(user.creationTime).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</TableCell>
                        <TableCell align="right">{user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</TableCell>
                        <TableCell align="right">{userAppointments.length}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Box sx={{ flex: 1, minWidth: 320 }}>
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
                  <TableCell align="right">נוצר בתאריך</TableCell>
                  <TableCell align="right">בוצע?</TableCell>
                  <TableCell align="right">מחיקה</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map(row => (
                  <TableRow key={row.id}>
                    <TableCell align="right">{row.name}</TableCell>
                    <TableCell align="right">{row.phone}</TableCell>
                    <TableCell align="right">{formatHebrewDate(row.date)}</TableCell>
                    <TableCell align="right">{row.time}</TableCell>
                    <TableCell align="right">{row.email}</TableCell>
                    <TableCell align="right">{row.createdAt ? new Date(row.createdAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant={row.done ? 'contained' : 'outlined'}
                        color={row.done ? 'success' : 'primary'}
                        size="small"
                        sx={{ fontWeight: 700, px: 2, minWidth: 0 }}
                        onClick={async () => {
                          const { getDoc, setDoc, deleteDoc, doc } = await import('firebase/firestore');
                          const appointmentRef = doc(db, 'appointments', row.id);
                          const appointmentSnap = await getDoc(appointmentRef);
                          if (appointmentSnap.exists()) {
                            const appointmentData = appointmentSnap.data();
                            await setDoc(doc(db, 'completed_appointments', row.id), {
                              ...appointmentData,
                              done: true,
                              completedAt: new Date().toISOString(),
                            });
                            await deleteDoc(appointmentRef);
                            setAppointments(apps => apps.filter(a => a.id !== row.id));
                          }
                        }}
                      >
                        {row.done ? '✔' : 'סמן בוצע'}
                      </Button>
                    </TableCell>
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
        <Box sx={{ flex: 1, minWidth: 220, maxWidth: 340 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, textAlign: 'center', color: '#388e3c', fontSize: 19 }}>
            תורים שבוצעו בשבוע האחרון
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small" sx={{ fontSize: 13 }}>
              <TableHead>
                <TableRow>
                  <TableCell align="right" sx={{ fontSize: 13 }}>שם</TableCell>
                  <TableCell align="right" sx={{ fontSize: 13 }}>טלפון</TableCell>
                  <TableCell align="right" sx={{ fontSize: 13 }}>תאריך</TableCell>
                  <TableCell align="right" sx={{ fontSize: 13 }}>שעה</TableCell>
                  <TableCell align="right" sx={{ fontSize: 13 }}>אימייל</TableCell>
                  <TableCell align="right" sx={{ fontSize: 13 }}>נוצר בתאריך</TableCell>
                  <TableCell align="right" sx={{ fontSize: 13 }}>מחיקה</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doneLastWeek.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: '#888' }}>
                      אין תורים שבוצעו בשבוע האחרון
                    </TableCell>
                  </TableRow>
                ) : (
                  doneLastWeek.map(row => (
                    <TableRow key={row.id}>
                      <TableCell align="right">{row.name}</TableCell>
                      <TableCell align="right">{row.phone}</TableCell>
                      <TableCell align="right">{formatHebrewDate(row.date)}</TableCell>
                      <TableCell align="right">{row.time}</TableCell>
                      <TableCell align="right">{row.email}</TableCell>
                      <TableCell align="right">{row.createdAt ? new Date(row.createdAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton color="error" onClick={() => handleDeleteCompleted(row.id)} size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
}

