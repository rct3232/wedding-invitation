'use client'

import React, { useEffect, useState } from 'react';

import styles from "./dateCounter.module.css";

export default function DateCounter (props) {
  const [counter, setCounter] = useState(0);
  const [timeLeft, setTimeLeft] = useState([0,0,0,0]);
  const INTERVAL = 1000;

  useEffect(() => {
    const diff = new Date() - props.date;
    const oneMinute = 1000 * 60;

    const d = Math.floor(diff / (oneMinute * 60 * 24));
    const h = Math.floor((diff % (oneMinute * 60 * 24)) / (oneMinute * 60));
    const m = Math.floor((diff % (oneMinute * 60)) / oneMinute);
    const s = Math.floor((diff % oneMinute) / 1000);

    setTimeLeft([d, h, m, s]);
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = [...timeLeft];
      
      if(parseInt(now[3]) > 0) now[3] -= 1;

      if (parseInt(now[3]) === 0) {
        if (parseInt(now[2]) === 0) {
          if (parseInt(now[1]) === 0) {
            if (parseInt(now[0]) === 0) clearInterval(timer);
            else {
              now[0] -= 1;
              now[1] = 23;
              now[2] = 59;
              now[3] = 59;
            }
          } else {
            now[1] -= 1;
            now[2] = 59;
            now[3] = 59;
          }
        } else {
          now[2] -= 1;
          now[3] = 59;
        }
      }

      setTimeLeft(now);
    }, INTERVAL);
    return clearInterval(timer);
  }, [timeLeft])

  return (
    <div className="detail">
      <div className="header">결혼식 까지</div>
        <div className={styles.datecounter}>
          <div className={styles.dateelement}>
            <p style={{fontWeight: 'bold', fontSize: '20px'}}>{timeLeft[0]}</p><p className={styles.body}>일</p>
          </div>
          <div className={styles.dateelement}>
            <p style={{fontWeight: 'bold', fontSize: '20px'}}>{timeLeft[1]}</p><p className={styles.body}>시간</p>
          </div>
          <div className={styles.dateelement}>
            <p style={{fontWeight: 'bold', fontSize: '20px'}}>{timeLeft[2]}</p><p className={styles.body}>분</p>
          </div>
          <div className={styles.dateelement}>
          <p style={{fontWeight: 'bold', fontSize: '20px'}}>{timeLeft[3]}</p><p className={styles.body}>초</p>
        </div>
      </div>
    </div>
  );
}