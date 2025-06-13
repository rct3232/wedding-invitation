"use client";

import React, { useState, useEffect } from "react";
import styles from "./splashOverlay.module.css";

const SplashOverlay = ({ data }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setSplashVisible(false);
    }, 4500);
    const timer2 = setTimeout(() => {
      setShowSplash(false);
    }, 5500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!showSplash) return null;

  return (
    <div className={`${styles.splash} ${!splashVisible ? styles.hide : ""}`}>
      <div className={styles["splash-text"]}>
        {data.person[0].name.kor.last}{data.person[0].name.kor.first} 💛 {data.person[1].name.kor.last}{data.person[1].name.kor.first}
      </div>
      <div className={`${styles["splash-text"]} ${styles.line2}`}>
        {data.content.splashText}
      </div>
    </div>
  );
};

export default SplashOverlay;