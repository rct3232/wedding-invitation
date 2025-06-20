"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./bgmPlayer.module.css";

const BgmPlayer = ({ bgmUrl }) => {
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isPlayed, setIsPlayed] = useState(true);

  const iconStyle = isMuted ? { backgroundImage: 'url("/mute.png")' } : { backgroundImage: 'url("/play.png")' };

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !bgmUrl) return;

    audioEl.muted = isMuted;
    audioEl.loop = true;
    audioEl.volume = 0.5;
    audioEl.preload = "auto";
    audioEl.src = bgmUrl;

    const onCanPlay = () => {
      setIsReady(true);
      audioEl.play().catch((e) => {
        console.warn("BGM play() 호출 실패:", e);
        setIsPlayed(false);
        setIsMuted(true);
      });
    };

    audioEl.addEventListener("canplaythrough", onCanPlay, { once: true });
    audioEl.load();

    return () => {
      audioEl.pause();
      audioEl.removeEventListener("canplaythrough", onCanPlay);
    };
  }, [bgmUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleMute = () => {
    if(!isPlayed, isMuted) {
      audioRef.current.play().catch((e) => {
        console.warn("BGM play() 호출 실패:", e);
        setIsPlayed(false);
        setIsMuted(true);
        return;
      });
    }
    setIsMuted((prev) => !prev);
  };

  return (
    <div className={styles.container}>
      <audio ref={audioRef} style={{ display: "none" }} />
      <button className={styles.button} onClick={toggleMute} disabled={!isReady} title={isReady ? "음소거 토글" : "버퍼링 중..."}>
        <div className={styles.muteIcon} style={iconStyle}/>
      </button>
    </div>
  );
}

export default BgmPlayer;