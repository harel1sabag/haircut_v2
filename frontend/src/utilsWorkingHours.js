// פונקציה שמביאה את שעות הפעילות מה-DB
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function fetchWorkingHours() {
  const ref = doc(db, 'settings', 'working_hours');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data();
  }
  // ברירת מחדל
  return {
    sunday:   { open: true,  from: '09:00', to: '18:00' },
    monday:   { open: true,  from: '09:00', to: '18:00' },
    tuesday:  { open: true,  from: '09:00', to: '18:00' },
    wednesday:{ open: true,  from: '09:00', to: '18:00' },
    thursday: { open: true,  from: '09:00', to: '18:00' },
    friday:   { open: true,  from: '09:00', to: '14:00' },
    saturday: { open: false, from: '',      to: ''      }
  };
}

// פונקציה שמחזירה האם יום/שעה מסוימים זמינים להזמנה
export function isTimeAvailable(workingHours, dateStr, timeStr) {
  // dateStr בפורמט YYYY-MM-DD
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay(); // 0=Sunday
  const dayKeys = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const key = dayKeys[dayOfWeek];
  const hours = workingHours[key];
  if (!hours || !hours.open) return false;
  if (!hours.from || !hours.to) return false;
  // בדוק אם השעה בטווח
  return (timeStr >= hours.from && timeStr <= hours.to);
}
