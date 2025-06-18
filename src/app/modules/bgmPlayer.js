"use client";

import React, { useState, useEffect } from "react";
import styles from "./bgmPlayer.module.css";

export default function BgmPlayer({ audioRef }) {
  const [isMuted, setIsMuted] = useState(false);

  // audioRef.current가 준비되면 muted 속성 동기화
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted, audioRef]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <div className={styles.container}>
      <button className={styles.button} onClick={toggleMute}>
        {isMuted ? "🔇" : "🔊"}
      </button>
    </div>
  );
}
