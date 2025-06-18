"use client";

import React from "react";
import styles from "./splashOverlay.module.css";

const SplashOverlay = ({ data, onStart }) => {
  return (
    <div className={styles.splash}>
      <div className={styles["splash-text"]}>
        {data.person[0].name.kor.last}
        {data.person[0].name.kor.first} 💛 {data.person[1].name.kor.last}
        {data.person[1].name.kor.first}
      </div>
      <div className={`${styles["splash-text"]} ${styles.line2}`}>
        {data.content.splashText}
      </div>
      <button className={styles.startButton} onClick={onStart}>
        시작하기
      </button>
    </div>
  );
};

export default SplashOverlay;
