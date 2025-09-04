"use client";

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./highlightCalendar.css";

const isSameDay = (a, b) => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const HighlightCalendar = ({ selectedDate }) => {
  const initialDate = selectedDate ? selectedDate : new Date();
  const [value, setValue] = useState(initialDate);

  const tileClassName = ({ date, view }) => {
    if (view === "month" && isSameDay(date, value)) {
      return "highlight";
    }
    return null;
  };

  return (
    <div className="calendarContainer">
      <Calendar
        onChange={setValue}
        value={value}
        tileClassName={tileClassName}
      />
    </div>
  );
};

export default HighlightCalendar;