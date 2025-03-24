import dayjs from "dayjs";

export const getRecordDates = (data) => {
  if (!data || !Array.isArray(data)) return [];
  
  const recordDates = [];
  const processed = new Set(); // To prevent duplicate dates
  
  data.forEach(el => {
    if (el && el.date) {
      try {
        let date;
        // Handle different date formats
        if (typeof el.date === 'string') {
          if (el.date.includes('.')) {
            // Format: D.M.YY or D.M.YYYY
            const dateParts = el.date.split('.');
            if (dateParts.length === 3) {
              const d = dateParts[0];
              const m = parseInt(dateParts[1]) - 1; // JavaScript months are 0-indexed
              const y = dateParts[2];
              const fullYear = y.length === 2 ? "20" + y : y;
              date = new Date(parseInt(fullYear), m, d);
            }
          } else if (el.date.includes('-')) {
            // ISO format: YYYY-MM-DD
            date = new Date(el.date);
          } else {
            // Try direct parsing
            date = new Date(el.date);
          }
        } else if (typeof el.date === 'number') {
          // Unix timestamp
          date = new Date(el.date * 1000);
        }
        
        if (date && !isNaN(date.getTime())) {
          const dateString = date.toDateString();
          if (!processed.has(dateString)) {
            recordDates.push(dateString);
            processed.add(dateString);
            // Reduced logging - only log once per detected date
            // console.log(`Added date: ${dateString} from original: ${el.date}`);
          }
        }
      } catch (error) {
        console.error("Error parsing date:", el.date, error);
      }
    }
  });
  
  // console.log("Record dates processed:", recordDates);
  return recordDates;
};

export const generateDate = (
  month = dayjs().month(),
  year = dayjs().year(),
  recordData = []
) => {
  const recordDates = getRecordDates(recordData);
  const firstDateOfMonth = dayjs().year(year).month(month).startOf("month");
  const lastDateOfMonth = dayjs().year(year).month(month).endOf("month");
  const arrayOfDate = [];
  
  // Generate prefix dates (previous month)
  for (let i = 0; i < firstDateOfMonth.day() - 1; i++) {
    const dateObj = firstDateOfMonth.day(i);
    arrayOfDate.push({
      currentMonth: false,
      date: dateObj,
      today: dateObj.toDate().toDateString() === dayjs().toDate().toDateString(),
      hasData: recordDates.includes(dateObj.toDate().toDateString())
    });
  }
  
  // Generate current month
  for (let i = firstDateOfMonth.date(); i <= lastDateOfMonth.date(); i++) {
    const currentDate = firstDateOfMonth.date(i);
    const dateString = currentDate.toDate().toDateString();
    const hasData = recordDates.includes(dateString);
    
    // Removed excessive logging
    // if (hasData) {
    //   console.log(`Date ${dateString} has data`);
    // }
    
    arrayOfDate.push({
      currentMonth: true,
      date: currentDate,
      today: dateString === dayjs().toDate().toDateString(),
      hasData: hasData
    });
  }
  
  // Generate suffix dates (next month)
  const remaining = 7 * 5 - arrayOfDate.length;
  for (let i = lastDateOfMonth.date() + 1; i <= lastDateOfMonth.date() + remaining; i++) {
    const dateObj = lastDateOfMonth.date(i);
    arrayOfDate.push({
      currentMonth: false,
      date: dateObj,
      today: dateObj.toDate().toDateString() === dayjs().toDate().toDateString(),
      hasData: recordDates.includes(dateObj.toDate().toDateString())
    });
  }
  
  return arrayOfDate;
};

export const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];