import React, { useState } from 'react';
import { Box, TextField, Button, MenuItem, Typography, Alert, Paper, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { CalendarPicker } from '@mui/x-date-pickers/CalendarPicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import heLocale from 'date-fns/locale/he';

const times = [
  '15:00', '16:00', '17:00', '18:00', '19:00',
];

export default function BookingForm({ onSuccess, user }) {
  React.useEffect(() => {
    async function addUserToFirestore() {
      if (!user?.uid) return;
      const { doc, getDoc, setDoc } = await import('firebase/firestore');
      // השתמש ב-db שמיובא מהקובץ firebase.js

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          creationTime: user.metadata?.creationTime || '',
          lastSignInTime: user.metadata?.lastSignInTime || '',
        });
      }
    }
    addUserToFirestore();
  }, [user]);
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [hasAppointment, setHasAppointment] = useState(false);

  const [appointmentDoc, setAppointmentDoc] = useState(null);

  React.useEffect(() => {
    async function checkExisting() {
      if (!user?.email && !form.name) return;
      const { getDocs, query, collection, where } = await import('firebase/firestore');
      const appointmentsRef = collection(db, "appointments");
      const q = user?.email
        ? query(appointmentsRef, where("email", "==", user.email))
        : query(appointmentsRef, where("name", "==", form.name));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setHasAppointment(true);
        setError('כבר קבעת תור. לא ניתן לקבוע יותר מאחד.');
        setAppointmentDoc({ ...snapshot.docs[0].data(), id: snapshot.docs[0].id });
      } else {
        setHasAppointment(false);
        setError('');
        setAppointmentDoc(null);
      }
    }
    checkExisting();
    // בדוק שוב אם המשתמש/שם משתנה
    // eslint-disable-next-line
  }, [user?.email, form.name]);

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
    const minDate = today.toISOString().split('T')[0];
    const maxDate = new Date(Date.now() + 13*24*60*60*1000).toISOString().split('T')[0];
    if (form.date < minDate || form.date > maxDate) {
      setError('ניתן לקבוע תור רק מהיום ועד שבועיים קדימה');
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
        createdAt: new Date().toISOString(),
        done: false
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

  if (hasAppointment && appointmentDoc) {
    const handleCancel = async () => {
      if (!window.confirm('האם לבטל את התור?')) return;
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'appointments', appointmentDoc.id));
      setHasAppointment(false);
      setAppointmentDoc(null);
      setError('');
    };
    return (
      <Box sx={{ bgcolor: '#fff3e0', borderRadius: 4, boxShadow: 3, p: 4, mt: 4, maxWidth: 420, mx: 'auto', textAlign: 'center', fontFamily: 'Heebo' }}>
        <Alert severity="error" sx={{ fontFamily: 'Heebo', fontSize: 20, fontWeight: 700, justifyContent: 'center', mb: 2 }}>
          כבר קבעת תור. לא ניתן לקבוע יותר מאחד.
        </Alert>
        <Box sx={{ fontSize: 18, mb: 2, color: '#333', fontWeight: 500 }}>
          <div>תאריך: <b>{appointmentDoc.date}</b></div>
          <div>שעה: <b>{appointmentDoc.time}</b></div>
          <div>שם: <b>{appointmentDoc.name}</b></div>
          {appointmentDoc.phone && <div>טלפון: <b>{appointmentDoc.phone}</b></div>}
        </Box>
        <Button variant="outlined" color="error" onClick={handleCancel} sx={{ fontWeight: 700, fontSize: 17, borderRadius: 3, px: 4, py: 1 }}>
          בטל תור
        </Button>
      </Box>
    );
  }
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
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700, color: '#1976d2', textAlign: 'right' }}>
        בחר תאריך:
      </Typography>
      <Paper elevation={3} sx={{ p: 1, mb: 2, bgcolor: '#fff', borderRadius: 2, direction: 'rtl', display: 'flex', justifyContent: 'center', alignItems: 'center', maxWidth: 420, width: '100%', boxSizing: 'border-box' }}>
        <Table sx={{ fontFamily: 'Heebo', direction: 'rtl', width: '100%', minWidth: 0, margin: '0 auto', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: '6px 10px' }}>
          <TableHead>
            <TableRow>
              {['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת'].map((day, i) => (
                <TableCell
                  key={i}
                  align="center"
                  sx={{
                    fontFamily: 'Heebo',
                    fontSize: 19,
                    fontWeight: 700,
                    color: '#1976d2',
                    bgcolor: 'transparent',
                    border: 'none',
                    borderRadius: 0,
                    py: 1,
                    px: 1.5,
                    letterSpacing: 1
                  }}
                >
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(() => {
              // צור את כל התאריכים בטווח
              const days = Array.from({length: 14}, (_, i) => {
                const dateObj = new Date(Date.now() + i*24*60*60*1000);
                const dateStr = dateObj.toISOString().split('T')[0];
                const day = dateObj.getDate();
                const month = dateObj.getMonth() + 1;
                const display = `${day}.${month}`;
                const weekdayIdx = dateObj.getDay(); // 0=א׳, 1=ב׳ ... 6=שבת
                const weekday = dateObj.toLocaleDateString('he-IL', { weekday: 'short' });
                return { dateStr, display, weekday, weekdayIdx };
              });
              // מצא את היום בשבוע של התאריך הראשון
              const firstDayIdx = days[0].weekdayIdx;
              // בנה מערך שורות, כל שורה 7 תאים (ימים בשבוע)
              const rows = [];
              let week = Array(7).fill(null);
              let dayPtr = 0;
              // מלא תאים ריקים בתחילת השבוע הראשון
              for (let i = 0; i < firstDayIdx; i++) week[i] = null;
              for (let i = 0; i < days.length; i++) {
                const d = days[i];
                week[d.weekdayIdx] = d;
                // אם הגענו לסוף שבוע או לסוף מערך — דחוף שורה
                if (d.weekdayIdx === 6 || i === days.length-1) {
                  rows.push(week);
                  week = Array(7).fill(null);
                }
              }
              return rows.map((week, idx) => (
                <TableRow key={idx}>
                  {week.map((d, colIdx) => {
                    if (!d) return <TableCell key={colIdx} sx={{ bgcolor: 'transparent', border: 'none', minWidth: 60, maxWidth: 80, height: 48, p: 1, m: 1.2 }} />;
                    const selected = form.date === d.dateStr;
                    return (
                      <TableCell
                        key={d.dateStr}
                        align="center"
                        sx={{
                          fontFamily: 'Heebo',
                          fontSize: 16,
                          borderRadius: '8px',
                          bgcolor: selected ? '#1976d2' : '#f5f5f5',
                          color: selected ? '#fff' : '#1565c0',
                          border: 'none',
                          fontWeight: selected ? 700 : 400,
                          cursor: 'pointer',
                          transition: '0.2s',
                          boxShadow: selected ? '0 2px 12px #1976d2bb' : '0 1px 2px #e0e0e0',
                          p: 1,
                          m: 1.2,
                          minWidth: 60,
                          maxWidth: 80,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          outline: selected ? '2px solid #1976d2' : 'none',
                          outlineOffset: '-2px',
                          '&:hover': {
                            bgcolor: selected ? '#115293' : '#e3e9f0',
                            color: selected ? '#fff' : '#1565c0',
                            boxShadow: '0 4px 16px #90caf9aa',
                          }
                        }}
                        onClick={() => {
                          setForm(f => ({ ...f, date: d.dateStr, time: '' }));
                          setError('');
                        }}
                      >
                        <div style={{fontSize: 18, fontWeight: 500, lineHeight: 1.2, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
  <span>{d.display}</span>
  {(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (d.dateStr === todayStr) {
      return (
        <span style={{
          marginTop: 4,
          background: '#ffeb3b',
          color: '#222',
          fontSize: 12,
          borderRadius: 7,
          padding: '0 7px',
          fontWeight: 700,
          boxShadow: '0 1px 4px #fbc02d44',
          letterSpacing: 0.5,
          display: 'inline-block'
        }}>היום</span>
      );
    }
    return null;
  })()}
</div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ));
            })()}
          </TableBody>
        </Table>
      </Paper>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700, color: '#1976d2', textAlign: 'right' }}>
        בחר שעה:
      </Typography>
      <Table sx={{ fontFamily: 'Heebo', direction: 'rtl', width: '100%', minWidth: 0, margin: '0 auto', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: '6px 10px', mb: 2 }}>
        <TableBody>
          <TableRow>
            {times.map((time) => (
              <TableCell
                key={time}
                align="center"
                sx={{
                  fontFamily: 'Heebo',
                  fontSize: 18,
                  borderRadius: '8px',
                  bgcolor: form.time === time ? '#1976d2' : '#f5f5f5',
                  color: form.time === time ? '#fff' : '#1565c0',
                  border: form.time === time ? 'none' : '1px solid #b3c6e0',
                  fontWeight: form.time === time ? 700 : 400,
                  cursor: 'pointer',
                  transition: '0.2s',
                  boxShadow: form.time === time ? '0 2px 12px #1976d2bb' : '0 1px 2px #e0e0e0',
                  p: 1,
                  m: 1.2,
                  minWidth: 60,
                  maxWidth: 80,
                  outline: form.time === time ? '2px solid #1976d2' : 'none',
                  outlineOffset: '-2px',
                  '&:hover': {
                    bgcolor: form.time === time ? '#115293' : '#e3e9f0',
                    color: form.time === time ? '#fff' : '#1976d2',
                    boxShadow: '0 4px 16px #90caf9aa',
                  }
                }}
                onClick={() => {
                  setForm(f => ({ ...f, time }));
                  setError('');
                }}
              >
                {time}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>

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
