import React, { useState, useEffect } from "react";
import DayPicker from "./DayPicker";
import Record from "./Record";
import readData from "../../utils/readData";
import dayjs from "dayjs";
import "../../App.css";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [recordData, setRecordData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Ensure selectedDate is always a dayjs object
  const handleDateChange = (date) => {
    // Convert to dayjs object if it's not already
    const dayjsDate = dayjs.isDayjs(date) ? date : dayjs(date);
    setSelectedDate(dayjsDate);
    
    // Log for debugging
    console.log("Date changed to:", dayjsDate.toDate().toDateString());
  };

  // Only load data when component mounts
  useEffect(() => {
    let isMounted = true;
    
    const loadRecordData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Loading record data...");
        const data = await readData();
        
        if (isMounted) {
          console.log(`Loaded ${data.length} records`);
          setRecordData(data);
        }
      } catch (error) {
        console.error("Error loading record data:", error);
        if (isMounted) {
          setError("Failed to load records. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRecordData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  // Find the record for the selected date and extract its sessions
  const getSessionsForSelectedDate = () => {
    if (!recordData || recordData.length === 0) return [];
    
    // Get the date string format we want to compare
    const selectedDateStr = dayjs.isDayjs(selectedDate) 
      ? selectedDate.toDate().toDateString() 
      : dayjs(selectedDate).toDate().toDateString();
    
    // Find the record for the selected date
    const recordForSelectedDate = recordData.find(record => {
      if (!record.date) return false;
      
      // Handle the record date string based on your data format
      let recordDateStr;
      
      try {
        if (typeof record.date === 'string') {
          if (record.date.includes('.')) {
            // Format: D.M.YY or D.M.YYYY
            const dateParts = record.date.split('.');
            if (dateParts.length === 3) {
              const d = dateParts[0];
              const m = parseInt(dateParts[1]) - 1; // JavaScript months are 0-indexed
              const y = dateParts[2];
              const fullYear = y.length === 2 ? "20" + y : y;
              recordDateStr = new Date(parseInt(fullYear), m, d).toDateString();
            }
          } else {
            // Try direct parsing
            recordDateStr = new Date(record.date).toDateString();
          }
        } else if (typeof record.date === 'number') {
          // Unix timestamp
          recordDateStr = new Date(record.date * 1000).toDateString();
        }
      } catch (error) {
        console.error("Error parsing record date:", record.date, error);
        return false;
      }
      
      // For debugging
      console.log("Comparing dates:", {
        record: record,
        recordDateStr: recordDateStr,
        selectedDateStr: selectedDateStr,
        matches: recordDateStr === selectedDateStr
      });
      
      return recordDateStr === selectedDateStr;
    });
    
    // If no matching record found, return empty array
    if (!recordForSelectedDate) {
      console.log(`No record found for date ${selectedDateStr}`);
      return [];
    }
    
    // Extract the sessions from the record
    const sessions = recordForSelectedDate.sessions || [];
    console.log(`Found ${sessions.length} sessions for date ${selectedDateStr}`, sessions);
    
    return sessions;
  };

  // Calculate summary details for the selected date
  const calculateDaySummary = (sessions) => {
    // If no sessions, return empty summary
    if (!sessions || sessions.length === 0) {
      const formattedDate = dayjs.isDayjs(selectedDate) 
        ? selectedDate.format('MMMM D, YYYY') 
        : dayjs(selectedDate).format('MMMM D, YYYY');
        
      return {
        date: formattedDate,
        len: 0,
        avg: 0,
        min: 0,
        max: 0,
        totDuration: 0,
        main: ""
      };
    }

    // Find the parent record that contains these sessions for summary data
    const selectedDateStr = dayjs.isDayjs(selectedDate) 
      ? selectedDate.toDate().toDateString() 
      : dayjs(selectedDate).toDate().toDateString();
    
    let recordForSelectedDate;
    
    // Find the record by checking date
    for (const record of recordData) {
      if (!record.date) continue;
      
      try {
        let recordDateStr;
        if (typeof record.date === 'string') {
          if (record.date.includes('.')) {
            const dateParts = record.date.split('.');
            if (dateParts.length === 3) {
              const d = dateParts[0];
              const m = parseInt(dateParts[1]) - 1;
              const y = dateParts[2];
              const fullYear = y.length === 2 ? "20" + y : y;
              recordDateStr = new Date(parseInt(fullYear), m, d).toDateString();
            }
          } else {
            recordDateStr = new Date(record.date).toDateString();
          }
        }
        
        if (recordDateStr === selectedDateStr) {
          recordForSelectedDate = record;
          break;
        }
      } catch (error) {
        console.error("Error checking record date:", record.date, error);
      }
    }
    
    // If we found the parent record, use its summary data
    if (recordForSelectedDate) {
      const formattedDate = dayjs.isDayjs(selectedDate) 
        ? selectedDate.format('MMMM D, YYYY') 
        : dayjs(selectedDate).format('MMMM D, YYYY');
      
      return {
        date: formattedDate,
        len: sessions.length,
        avg: recordForSelectedDate.avg || 0,
        min: recordForSelectedDate.min || 0,
        max: recordForSelectedDate.max || 0,
        totDuration: recordForSelectedDate.totDuration || 0,
        main: recordForSelectedDate.main || ""
      };
    }
    
    // Fallback to calculating from sessions if we couldn't find the parent record
    const formattedDate = dayjs.isDayjs(selectedDate) 
      ? selectedDate.format('MMMM D, YYYY') 
      : dayjs(selectedDate).format('MMMM D, YYYY');
      
    // Calculate min, max, avg across all sessions
    const mins = sessions.map(s => s.min).filter(Boolean);
    const maxes = sessions.map(s => s.max).filter(Boolean);
    const avgs = sessions.map(s => s.avg).filter(Boolean);
    
    // Calculate total duration in minutes
    const totalDuration = sessions.reduce((total, session) => {
      // Convert ms to minutes (duration is in milliseconds)
      const durationMinutes = session.duration ? session.duration / 60000 : 0;
      return total + durationMinutes;
    }, 0);
    
    return {
      date: formattedDate,
      len: sessions.length,
      avg: avgs.length > 0 ? Math.round(avgs.reduce((sum, val) => sum + val, 0) / avgs.length) : 0,
      min: mins.length > 0 ? Math.min(...mins) : 0,
      max: maxes.length > 0 ? Math.max(...maxes) : 0,
      totDuration: Math.round(totalDuration),
      main: ""
    };
  };

  const sessionsForSelectedDate = getSessionsForSelectedDate();
  const daySummary = calculateDaySummary(sessionsForSelectedDate);

  return (
    <div className="w-full gradient-stroke flex flex-col flex-1 h-full max-h-full overflow-hidden">
      <div className="w-full pt-5 pl-8 pr-5 content flex-1 flex flex-col max-h-full overflow-hidden">
        <h1 className="text-3xl font-semibold pb-6">My Records</h1>
  
        {isLoading ? (
          <div className="flex justify-center items-center text-xl">
            <p>Loading your records...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <div className="flex flex-1 w-full mx-auto overflow-hidden">
            <DayPicker 
              onDateChange={handleDateChange} 
              recordData={recordData} 
              className="w-1/2"
            />
            <div className="w-1/2 pl-5 pr-2 flex-1 max-h-full overflow-y-auto custom-scrollbar">
              <Record 
                sessions={sessionsForSelectedDate} 
                date={selectedDate} 
                details={daySummary} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );  
}