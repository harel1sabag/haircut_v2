import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  Paper, 
  Table, 
  TableBody, 
  TableRow, 
  TableCell, 
  Grid,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import heLocale from 'date-fns/locale/he';
import CustomMonthCalendar from './CustomMonthCalendar';
import './CustomMonthCalendar.css';
import { fetchWorkingHours } from './utilsWorkingHours';

// שעות העבודה של האדמין
const dayKeys = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];


export default function BookingForm({ onSuccess, user, activeAppointment }) {
  // State management
  const [form, setForm] = useState({ 
    name: user?.displayName || '', 
    phone: '', 
    date: null, 
    time: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [hasAppointment, setHasAppointment] = useState(!!activeAppointment);
  const [appointmentDoc, setAppointmentDoc] = useState(activeAppointment || null);
  const [workingHours, setWorkingHours] = useState(null);
  const [times, setTimes] = useState([]);

  useEffect(() => {
    fetchWorkingHours().then(hours => setWorkingHours(hours));
  }, []);

  // עדכן את רשימת השעות בכל פעם שנבחר תאריך
  useEffect(() => {
    if (!form.date || !workingHours) {
      setTimes([]);
      return;
    }
    const dayIdx = form.date.getDay();
    const key = dayKeys[dayIdx];
    const hours = workingHours[key];
    if (!hours || !hours.open || !hours.from || !hours.to) {
      setTimes([]);
      return;
    }
    console.log('שעות עבודה:', hours);
    
    // צור מערך של כל השעות בטווח (ברווחים של שעה)
    const slots = [];
    let [fromH, fromM] = hours.from.split(':').map(Number);
    let [toH, toM] = hours.to.split(':').map(Number);
    
    // יצירת אובייקט תאריך נוכחי
    let current = new Date(form.date);
    current.setHours(fromH, fromM, 0, 0);
    
    // אם השעה ההתחלתית לא עגולה, נוסיף את השעה הבאה
    if (fromM > 0) {
      current.setHours(fromH + 1, 0, 0, 0);
    }
    
    // הגדרת שעת סיום
    const end = new Date(form.date);
    end.setHours(toH, toM, 0, 0);
    
    console.log('טווח שעות:', current.getHours() + ':00', '-', end.getHours() + ':00');
    
    // לולאה ליצירת השעות
    while (current <= end) {
      const h = String(current.getHours()).padStart(2, '0');
      const timeStr = `${h}:00`;  // תמיד שעה עגולה
      slots.push(timeStr);
      console.log('הוספתי שעה:', timeStr);
      
      // מעבר לשעה הבאה
      current.setHours(current.getHours() + 1);
    }
    
    console.log('כל השעות הזמינות:', slots);
    setTimes(slots);
  }, [form.date, workingHours]);

  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [openTimePicker, setOpenTimePicker] = useState(false);
  
  // Responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Set user data if available
  useEffect(() => {
    if (user?.displayName) {
      setForm(prev => ({ ...prev, name: user.displayName }));
    }
  }, [user]);
  
  // Form validation functions
  const validateName = (name) => {
    if (!name.trim()) return 'יש להזין שם';
    if (!/^[א-ת\s]+$/.test(name)) return 'השם חייב להיות בעברית בלבד';
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone) return '';
    if (!/^05\d{8}$/.test(phone)) return 'מספר טלפון לא תקין';
    return '';
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Validate fields
    if (name === 'name') setNameError(validateName(value));
    if (name === 'phone') setPhoneError(validatePhone(value));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // הגנות על ערכי הטופס
      if (!form || typeof form !== 'object') throw new Error('form state is invalid');
      if (!form.date || isNaN(new Date(form.date))) {
        setError('תאריך לא תקין');
        return;
      }
      if (!form.time || typeof form.time !== 'string' || !/^[0-2][0-9]:[0-5][0-9]$/.test(form.time)) {
        setError('שעה לא תקינה');
        return;
      }

      // Validate form
      const nameValidation = validateName(form.name);
      const phoneValidation = validatePhone(form.phone);
      if (nameValidation || phoneValidation) {
        setNameError(nameValidation);
        setPhoneError(phoneValidation);
        return;
      }

      // מניעת קביעת תור לעבר
      const now = new Date();
      const selectedDate = new Date(form.date);
      const [h, m] = form.time.split(':').map(Number);
      selectedDate.setHours(h, m, 0, 0);
      if (selectedDate < now) {
        setError('לא ניתן לקבוע תור לעבר');
        return;
      }

      setLoading(true);
      setError('');

      // Save appointment to Firestore
      const docRef = await addDoc(collection(db, 'appointments'), {
        name: form.name,
        phone: form.phone || null,
        date: form.date.toISOString(),
        time: form.time,
        email: user?.email || null,
        userId: user?.uid || null,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });

      // Update state
      const newAppointment = {
        id: docRef.id,
        ...form,
        date: form.date ? form.date.toLocaleDateString('he-IL') : '',
        queueNumber: Math.floor(Math.random() * 100)
      };
      setAppointmentDoc(newAppointment);
      setHasAppointment(true);
      onSuccess?.(newAppointment);
    } catch (err) {
      console.error('CRITICAL ERROR in BookingForm handleSubmit:', err);
      setError('אירעה שגיאה קריטית. אנא נסה לרענן את הדף או נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  // Check if a date is disabled (weekends + past dates)
  const ALLOWED_DAYS = [0, 1, 2, 3, 4, 5, 6];
  const isDateDisabled = (date) => {
    const day = date.getDay();
    const today = new Date();
    today.setHours(0,0,0,0);
    return !ALLOWED_DAYS.includes(day) || date < today;
  };
  
  // בדיקת זמינות שעת תור לפי שעות האדמין (מותאם לשעות עגולות)
  const isTimeAvailable = (time) => {
    if (!form || !form.date || !workingHours) return false;
    if (typeof time !== 'string' || !/^[0-2][0-9]:00$/.test(time)) return false;
    
    const now = new Date();
    const selectedDate = new Date(form.date);
    if (isNaN(selectedDate)) return false;
    
    // בדיקה אם התאריך עתידי או היום
    const isToday = 
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate();
    
    // אם זה היום, נבדוק שהשעה לא עברה
    if (isToday) {
      const [h] = time.split(':').map(Number);
      if (h < now.getHours()) {
        return false;
      }
      // אם השעה הנוכחית היא בדיוק השעה הנבדקת, נבדוק את הדקות
      if (h === now.getHours() && now.getMinutes() > 0) {
        return false;
      }
    }
    
    return true;
  };

  
  // Handle date selection
  const handleDateSelect = (date) => {
    setForm(prev => ({ ...prev, date, time: '' }));
    setOpenDatePicker(false);
  };
  
  // Handle time selection
  const handleTimeSelect = (time) => {
    setForm(prev => ({ ...prev, time }));
    setOpenTimePicker(false);
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('he-IL');
  };

  // If user already has an appointment, show the appointment details
  if (hasAppointment && appointmentDoc) {
    return (
      <Box sx={{
        maxWidth: 600,
        mx: 'auto',
        p: { xs: 2, sm: 3 },
        mt: { xs: 2, sm: 4 },
        textAlign: 'center'
      }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2, sm: 4 }, 
            borderRadius: 2, 
            bgcolor: 'success.light',
            border: '1px solid',
            borderColor: 'success.main',
            textAlign: 'center'
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: 'success.dark' }}>
            התור שלך נקבע בהצלחה! 
          </Typography>
          
          <Table 
            size="small" 
            sx={{ 
              maxWidth: 400, 
              margin: '0 auto', 
              mb: 2, 
              background: 'none', 
              boxShadow: 'none', 
              border: 'none' 
            }}
          >
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>תאריך:</TableCell>
                <TableCell>{appointmentDoc?.date}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>שעה:</TableCell>
                <TableCell>{appointmentDoc?.time}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>שם:</TableCell>
                <TableCell>{appointmentDoc?.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>טלפון:</TableCell>
                <TableCell>{appointmentDoc?.phone}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
            נשמח לראותך אצלנו!
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Main booking form
  return (
    <Box sx={{
      maxWidth: 600,
      mx: 'auto',
      p: { xs: 1, sm: 3 },
      mt: { xs: 1, sm: 4 },
      mb: 4,
      direction: 'rtl'
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, sm: 4 }, 
          borderRadius: 2, 
          bgcolor: 'background.paper',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold', 
            mb: 3, 
            textAlign: 'center',
            color: 'primary.main'
          }}
        >
          קביעת תור למספרה
        </Typography>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 1,
              '& .MuiAlert-message': {
                width: '100%',
                textAlign: 'center'
              }
            }}
          >
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Name Field */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="שם מלא"
                name="name"
                value={form.name}
                onChange={handleChange}
                error={!!nameError}
                helperText={nameError}
                disabled={loading}
                required
                variant="outlined"
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#ddd',
                    },
                    '&:hover fieldset': {
                      borderColor: '#aaa',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                }}
                inputProps={{
                  dir: 'rtl',
                  style: { 
                    textAlign: 'right',
                    padding: isMobile ? '10px 14px' : '12px 14px',
                  }
                }}
                InputLabelProps={{
                  sx: {
                    right: isMobile ? 0 : 0,
                    left: 'auto',
                    '&.Mui-focused': {
                      color: '#1976d2',
                    },
                  }
                }}
              />
            </Grid>
            
            {/* Phone Field */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="טלפון"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                error={!!phoneError}
                helperText={phoneError || 'לא חובה'}
                disabled={loading}
                variant="outlined"
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#ddd',
                    },
                    '&:hover fieldset': {
                      borderColor: '#aaa',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                }}
                inputProps={{
                  dir: 'ltr',
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  style: { 
                    textAlign: 'right',
                    padding: isMobile ? '10px 14px' : '12px 14px',
                  }
                }}
                InputLabelProps={{
                  sx: {
                    right: isMobile ? 0 : 0,
                    left: 'auto',
                    '&.Mui-focused': {
                      color: '#1976d2',
                    },
                  }
                }}
              />
            </Grid>
            
            {/* Date Picker */}
            <Grid item xs={12}>
              {(() => {
                let daysEnabled = [0,1,2,3,4,5,6];
                if (workingHours) {
                  daysEnabled = Object.entries(workingHours)
                    .map(([day, info], idx) => info && info.open ? idx : null)
                    .filter(idx => idx !== null);
                }

                return (
                  <div className="calendar-container">
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2, mt: 1, textAlign: 'right' }}>
                      בחר תאריך:
                    </Typography>
                    <CustomMonthCalendar
                      value={form.date}
                      onChange={handleDateSelect}
                      daysEnabled={daysEnabled}
                    />
                  </div>
                );
              })()}
            </Grid>
            
            {/* Time Picker */}
            <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2, mt: 1, textAlign: 'right' }}>
                  בחר שעה:
                </Typography>
              
              {isMobile ? (
                <>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setOpenTimePicker(true)}
                    disabled={!form.date || loading}
                    sx={{ 
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      py: 1.5,
                      borderRadius: 1,
                      borderColor: form.time ? 'primary.main' : 'text.disabled',
                      color: form.time ? 'text.primary' : 'text.secondary',
                      fontSize: '1rem'
                    }}
                  >
                    {form.time || 'לחץ לבחירת שעה'}
                  </Button>
                  
                  <Dialog 
                    open={openTimePicker} 
                    onClose={() => setOpenTimePicker(false)}
                    maxWidth="xs"
                    fullWidth
                  >
                    <DialogTitle sx={{ textAlign: 'center' }}>בחר שעה</DialogTitle>
                    <IconButton
                      aria-label="close"
                      onClick={() => setOpenTimePicker(false)}
                      sx={{
                        position: 'absolute',
                        left: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                    <DialogContent>
                      <Grid container spacing={1}>
                        {times.map((time) => (
                          <Grid item xs={6} key={time}>
                            <Button
                              fullWidth
                              variant={form.time === time ? 'contained' : 'outlined'}
                              onClick={() => handleTimeSelect(time)}
                              disabled={!isTimeAvailable(time) || loading}
                              sx={{
                                py: 1.5,
                                borderRadius: 2,
                                fontSize: '1rem',
                              }}
                            >
                              {time}
                            </Button>
                          </Grid>
                        ))}
                      </Grid>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                times.length === 0 ? (
                  <Typography color="text.secondary" sx={{ width: '100%', textAlign: 'center', py: 3 }}>
                    אין שעות פעילות ליום זה
                  </Typography>
                ) : (
                  <Grid container spacing={1}>
                    {times.map((time) => (
                      <Grid item xs={4} sm={2.4} key={time}>
                        <Button
                          fullWidth
                          variant={form.time === time ? 'contained' : 'outlined'}
                          onClick={() => handleTimeSelect(time)}
                          disabled={!form.date || !isTimeAvailable(time) || loading}
                          sx={{
                            py: 1.5,
                            borderRadius: 2,
                            minWidth: 'auto',
                            fontSize: '0.9rem',
                            '&.MuiButton-contained': {
                              backgroundColor: 'primary.main',
                              color: 'primary.contrastText',
                              '&:hover': {
                                backgroundColor: 'primary.dark',
                              },
                            },
                          }}
                        >
                          {time}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                )
              )}
            </Grid>
            
            {/* Submit Button */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading || !form.date || !form.time}
                sx={{
                  py: isMobile ? 1.2 : 1.5,
                  borderRadius: 2,
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  boxShadow: 2,
                  mt: 1,
                  '&:hover': {
                    boxShadow: 4,
                    bgcolor: 'primary.dark',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(0, 0, 0, 0.12)',
                    color: 'rgba(0, 0, 0, 0.26)',
                  },
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                    שומר...
                  </>
                ) : 'אשר תור'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
