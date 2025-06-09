'use client'

import React, { useEffect, useState, useRef } from 'react';

import styles from "./backgroundCollage.module.css"

export default function BackgroundCollage () {
  const [innerWidth, setInnerWidth] = useState(0);
  const [innerHeight, setInnerHeight] = useState(0);
  const [columnCount, setColumnCount] = useState(0);
  const [rowCount, setRowCount] = useState(0)
  const [minusMargin, setMinusMargin] = useState([]);

  const resizeListener = () => {
    setInnerWidth(window.innerWidth);
    setInnerHeight(window.innerHeight);
  };

  useEffect(() => {
    window.addEventListener("resize", resizeListener);

    return () => {
      window.removeEventListener("resize", resizeListener);
    };
  }, []);

  useEffect(() => {
    const freeSpace = innerWidth - 420;
    setColumnCount(Math.ceil((freeSpace / 2) / 220));
  }, [innerWidth]);

  useEffect(() => {
    setRowCount(Math.ceil(innerHeight / 320));
  }, [innerHeight]);

  useEffect(() => {
    const marginArray = minusMargin;
    const diff = columnCount - (minusMargin.length / 2)
    if (diff > 0) {
      for (i = 0; i < diff; i++) {
        marginArray.unshift(String(Math.floor((Math.random() * 300) % 50 * 6) * -1) + "px");
        marginArray.push(String(Math.floor((Math.random() * 300) % 50 * 6) * -1) + "px");
      }
    } else if (diff < 0) {
      marginArray.shift();
      marginArray.pop()
    }
  }, [columnCount])

  return (
    <div className={styles.collageContainer}>
      {Array(columnCount).fill(null).map((value, item) => {
        const minusMargin = String(Math.floor((Math.random() * 300) % 50 * 6) * -1) + "px"
        return (
          <div className={styles.collageColumn} style={{marginTop: minusMargin}}>
            {Array(rowCount).fill(null).map((value, item) => {return (
              <div className={styles.dummyImage}/>);
            })}
          </div>
        );
      })}
      <div style={{width: '400px', height: '100%'}}></div>
      {Array(columnCount).fill(null).map((value, item) => {
        const minusMargin = String(Math.floor((Math.random() * 1000) % 100 * 3) * -1) + "px"
        return (
          <div className={styles.collageColumn} style={{marginTop: minusMargin}}>
            {Array(rowCount).fill(null).map((value, item) => {return (
              <div className={styles.dummyImage}/>);
            })}
          </div>
        );
      })}
    </div>
  );
}