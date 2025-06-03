import React from 'react';
import './CustomMonthCalendar.css';

const daysHebrew = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const matrix = [];
  let week = Array(7).fill(null);
  let day = 1;
  // Start from the correct day of week
  let startIdx = firstDay.getDay();
  for (let i = 0; i < startIdx; i++) week[i] = null;
  for (; day <= lastDay.getDate(); day++) {
    week[startIdx] = day;
    startIdx++;
    if (startIdx === 7) {
      matrix.push(week);
      week = Array(7).fill(null);
      startIdx = 0;
    }
  }
  if (week.some(x => x !== null)) matrix.push(week);
  // Fill empty weeks to always have 5 rows
  while (matrix.length < 5) matrix.push(Array(7).fill(null));
  return matrix;
}

// daysEnabled: מערך של מספרי ימים שמותרים לבחירה (0=ראשון, 1=שני, ...)
export default function CustomMonthCalendar({ value, onChange, daysEnabled = [0,1,2,3,4,5,6] }) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 13);
  const year = value?.getFullYear() || today.getFullYear();
  const month = value?.getMonth() || today.getMonth();
  const matrix = getMonthMatrix(year, month);

  return (
    <div className="calendar-container">

      <table className="calendar-table">
        <thead>
          <tr>
            {daysHebrew.map(day => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((week, i) => (
            <tr key={i}>
              {week.map((day, j) => (
                <td
  key={j}
  className={[
    j === 6 ? 'shabbat' : '',
    value && day &&
      value instanceof Date &&
      value.getDate() === day &&
      value.getMonth() === month &&
      value.getFullYear() === year
      ? 'selected' : '',
    day && (new Date(year, month, day) < today || new Date(year, month, day) > maxDate || !daysEnabled.includes(new Date(year, month, day).getDay())) ? 'disabled' : ''
  ].join(' ')}
  onClick={
    day && !(new Date(year, month, day) < today || new Date(year, month, day) > maxDate || !daysEnabled.includes(new Date(year, month, day).getDay()))
      ? () => onChange(new Date(year, month, day))
      : undefined
  }
  style={{ cursor: day && !(new Date(year, month, day) < today || new Date(year, month, day) > maxDate || !daysEnabled.includes(new Date(year, month, day).getDay())) ? 'pointer' : 'default' }}
>
  {day && <span>{day}</span>}
</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="calendar-notes"></div>
    </div>
  );
}
