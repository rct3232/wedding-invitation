'use client'

import React, { useEffect, useState, useRef } from 'react';

import styles from "./dateCounter.module.css";

export default function DateCounter (props) {
  const [timeLeft, setTimeLeft] = useState([0,0,0,0]);
  const timerId = useRef(null);
  const INTERVAL = 1000;

  useEffect(() => {
    const computeTime = () => {
      const diff = props.date - new Date();
      const oneMinute = 1000 * 60;
  
      const d = Math.floor(diff / (oneMinute * 60 * 24));
      const h = Math.floor((diff % (oneMinute * 60 * 24)) / (oneMinute * 60));
      const m = Math.floor((diff % (oneMinute * 60)) / oneMinute);
      const s = Math.floor((diff % oneMinute) / 1000);
  
      setTimeLeft([d, h, m, s]);
    };

    computeTime();
    timerId.current = setInterval(computeTime, INTERVAL);

  }, [])

  return (
    <div className="detail">
      <div className="header">결혼식 까지</div>
        <div className={styles.container}>
          <div className={styles.element}>
            <p className={styles.leftNumber}>{timeLeft[0]}</p><p className="little">일</p>
          </div>
          <div className={styles.element}>
            <p className={styles.leftNumber}>{timeLeft[1]}</p><p className="little">시간</p>
          </div>
          <div className={styles.element}>
            <p className={styles.leftNumber}>{timeLeft[2]}</p><p className="little">분</p>
          </div>
          <div className={styles.element}>
          <p className={styles.leftNumber}>{timeLeft[3]}</p><p className="little">초</p>
        </div>
      </div>
    </div>
  );
}