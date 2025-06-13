// modules/HighlightCalendar.js
"use client";

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./highlightCalendar.css";

// 두 날짜가 같은 날인지 비교하는 함수
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function HighlightCalendar({ selectedDate }) {
  // selectedDate가 전달되지 않으면 오늘 날짜를 기본값으로 사용
  const initialDate = selectedDate ? selectedDate : new Date();
  const [value, setValue] = useState(initialDate);

  console.log(value);

  // 날짜 타일에 custom 클래스를 추가해 선택한 날짜를 하이라이트
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
}
