import React, { useEffect, useState, useMemo } from "react";
import { generateDate, months } from "../../utils/calendar";
import dayjs from "dayjs";
import cn from "../../utils/cn";
import ChevronL from "../ui/icons/ChevronL";
import ChevronR from "../ui/icons/ChevronR";

export default function DayPicker({ onDateChange, recordData }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const currentDate = dayjs();
  const [today, setToday] = useState(currentDate);
  const [selectDate, setSelectDate] = useState(currentDate);

  // Memoize the calendar dates generation to prevent recalculation on every render
  const calendarDates = useMemo(() => {
    return generateDate(today.month(), today.year(), recordData);
  }, [today, recordData]);

  // Update parent component when date is selected
  useEffect(() => {
    // Use the correct format that matches your data filtering logic
    onDateChange(selectDate);
  }, [selectDate, onDateChange]);

  // Function to safely handle date selection
  const handleDateSelect = (date) => {
    if (dayjs.isDayjs(date)) {
      setSelectDate(date);
    } else {
      setSelectDate(dayjs(date));
    }
  };

  return (
    <div className="w-96 h-96">
      <div className="flex justify-between">
        <h1 className="font-semibold text-2xl">{months[today.month()]}, {today.year()}</h1>
        <div className="flex items-center gap-5">
          <div className="rounded-full bg-[#113766] p-2 hover:bg-[#153154] cursor-pointer"  onClick={() => {
              setToday(today.month(today.month() - 1));
            }} >
            <ChevronL className="w-5 h-5"/>
          </div>
          <h1 className="cursor-pointer hover:text-[#9FD3E8]" onClick={() => {
            setToday(currentDate);
            handleDateSelect(currentDate);
          }}>Today</h1>
          <div className="rounded-full bg-[#113766] p-2 hover:bg-[#153154] cursor-pointer"  onClick={() => {
              setToday(today.month(today.month() + 1));
            }} >
            <ChevronR className="w-5 h-5"/>
          </div>
        </div>
      </div>
      <div className="w-full grid grid-cols-7 text-[#80AAC2] mt-2">
        {days.map((day, index) => (
          <h1 key={index} className="h-14 grid place-content-center text-sm">{day}</h1>
        ))}
      </div>
      <div className="w-full grid grid-cols-7">
        {calendarDates.map(({ date, currentMonth, today: isToday, hasData }, index) => (
          <div key={index} className="h-14 grid place-content-center text-sm">
            <h1 className={cn(
              currentMonth ? "" : "opacity-70",
              isToday ? "border border-white" : "",
              selectDate.toDate().toDateString() === date.toDate().toDateString() ? "bg-[#F85ED4] border-[#F85ED4] text-white" : "",
              "h-10 w-10 grid place-content-center rounded-full hover:bg-[#331949] transition-all cursor-pointer relative p-1"
            )}
            onClick={() => {
              handleDateSelect(date);
            }}
            >
              {date.date()}
              {hasData && (
                <span className={cn(
                  selectDate.toDate().toDateString() === date.toDate().toDateString() ? "bg-white" : "bg-[#F85ED4]",
                  "absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full")}
                ></span>
              )}
            </h1>
          </div>
        ))}
      </div>
    </div>
  );
}