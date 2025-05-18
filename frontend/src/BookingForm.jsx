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
import { CalendarPicker } from '@mui/x-date-pickers/CalendarPicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import heLocale from 'date-fns/locale/he';

// Available time slots
const TIMES = ['15:00', '16:00', '17:00', '18:00', '19:00'];

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
    
    // Validate form
    const nameValidation = validateName(form.name);
    const phoneValidation = validatePhone(form.phone);
    
    if (nameValidation || phoneValidation) {
      setNameError(nameValidation);
      setPhoneError(phoneValidation);
      return;
    }
    
    if (!form.date || !form.time) {
      setError('אנא בחר תאריך ושעה');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
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
        queueNumber: Math.floor(Math.random() * 100) // Generate a random queue number
      };
      
      setAppointmentDoc(newAppointment);
      setHasAppointment(true);
      onSuccess?.(newAppointment);
      
    } catch (err) {
      console.error('Error saving appointment:', err);
      setError('אירעה שגיאה בשמירת התור. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };
  
  // Check if a date is disabled (weekends + past dates)
  const isDateDisabled = (date) => {
    const day = date.getDay();
    const today = new Date();
    today.setHours(0,0,0,0);
    // Disable Friday, Saturday, and any date before today
    return day === 5 || day === 6 || date < today;
  };
  
  // Check if a time slot is available
  const isTimeAvailable = (time) => {
    if (!form.date) return false;
    // Add your availability logic here
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
            התור שלך נקבע בהצלחה! 🎉
          </Typography>
          
          <Table 
            size="small" 
            sx={{ 
              maxWidth: 400, 
              mx: 'auto',
              '& .MuiTableCell-root': { 
                border: 'none', 
                px: 1, 
                py: 0.5, 
                fontSize: 16, 
              }
            }}
          >
            <TableBody>
              <TableRow>
                <TableCell>שם:</TableCell>
                <TableCell>{appointmentDoc.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>תאריך:</TableCell>
                <TableCell>{appointmentDoc.date}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>שעה:</TableCell>
                <TableCell>{appointmentDoc.time}</TableCell>
                <TableCell sx={{ textAlign: 'right', pr: 0 }}>{appointmentDoc.time}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 500, textAlign: 'left', pl: 0 }}>מספר תור:</TableCell>
                <TableCell sx={{ textAlign: 'right', pr: 0, fontWeight: 'bold', color: 'primary.main' }}>
                  {appointmentDoc.queueNumber}
                </TableCell>
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
      p: { xs: 2, sm: 3 },
      mt: { xs: 2, sm: 4 },
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, sm: 4 }, 
          borderRadius: 2, 
          bgcolor: 'background.paper',
          position: 'relative'
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
                sx={{ mb: 1 }}
                inputProps={{
                  dir: 'rtl',
                  style: { textAlign: 'right' }
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
                sx={{ mb: 1 }}
                inputProps={{
                  dir: 'ltr',
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  style: { textAlign: 'right' }
                }}
              />
            </Grid>
            
            {/* Date Picker */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, mb: 1 }}>
                בחר תאריך:
              </Typography>
              {isMobile ? (
                <>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setOpenDatePicker(true)}
                    disabled={loading}
                    sx={{ 
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      py: 1.5,
                      borderRadius: 1,
                      borderColor: form.date ? 'primary.main' : 'text.disabled',
                      color: form.date ? 'text.primary' : 'text.secondary',
                      fontSize: '1rem'
                    }}
                  >
                    {form.date ? form.date.toLocaleDateString('he-IL') : 'לחץ לבחירת תאריך'}
                  </Button>
                  
                  <Dialog 
                    open={openDatePicker} 
                    onClose={() => setOpenDatePicker(false)}
                    maxWidth="xs"
                    fullWidth
                  >
                    <DialogTitle sx={{ textAlign: 'center' }}>בחר תאריך</DialogTitle>
                    <IconButton
                      aria-label="close"
                      onClick={() => setOpenDatePicker(false)}
                      sx={{
                        position: 'absolute',
                        left: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                    <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
                        <CalendarPicker
                          date={form.date || new Date()}
                          onChange={handleDateSelect}
                          disablePast
                          shouldDisableDate={isDateDisabled}
                          renderDay={(day, _value, DayComponentProps) => {
                            const isSelected = form.date && day.toDateString() === form.date.toDateString();
                            return (
                              <PickersDay
                                {...DayComponentProps}
                                selected={isSelected}
                                disabled={isDateDisabled(day)}
                                sx={{
                                  '&.Mui-selected': {
                                    backgroundColor: 'primary.main',
                                    color: 'primary.contrastText',
                                    '&:hover': {
                                      backgroundColor: 'primary.dark',
                                    },
                                  },
                                }}
                              />
                            );
                          }}
                        />
                      </LocalizationProvider>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    border: '1px solid', 
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    bgcolor: 'background.default'
                  }}>
                    <CalendarPicker
                      date={form.date}
                      onChange={handleDateSelect}
                      disablePast
                      shouldDisableDate={isDateDisabled}
                      renderDay={(day, _value, DayComponentProps) => {
                        const isSelected = form.date && day.toDateString() === form.date.toDateString();
                        return (
                          <PickersDay
                            {...DayComponentProps}
                            selected={isSelected}
                            disabled={isDateDisabled(day)}
                            sx={{
                              '&.Mui-selected': {
                                backgroundColor: 'primary.main',
                                color: 'primary.contrastText',
                                '&:hover': {
                                  backgroundColor: 'primary.dark',
                                },
                              },
                            }}
                          />
                        );
                      }}
                    />
                  </Box>
                </LocalizationProvider>
              )}
            </Grid>
            
            {/* Time Picker */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, mb: 1 }}>
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
                        {TIMES.map((time) => (
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
                <Grid container spacing={1}>
                  {TIMES.map((time) => (
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
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                    bgcolor: 'primary.dark',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'text.disabled',
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
