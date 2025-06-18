"use client";

import React, { useState, useEffect, useRef } from "react";
import Confetti from "react-confetti";
import styles from "./page.module.css";

import SplashOverlay from "./modules/splashOverlay";
import HeaderImage from "./modules/headerImage";
import Nametag from "./modules/nametag";
import Greeting from "./modules/greeting";
import DateCounter from "./modules/dateCounter";
import HighlightCalendar from "./modules/highlightCalendar";
import Gallery from "./modules/gallery/gallery";
import Route from "./modules/route";
import BankAccountAccordion from "./modules/bankAccountAccordion";
import Guestbook from "./modules/guestbook";
import BgmPlayer from "./modules/bgmPlayer";
import useWeddingData from "./modules/useWeddingData";

export const dynamic = "force-dynamic";

export default function Home() {
  const { data, query } = useWeddingData();
  const [started, setStarted] = useState(false);
  const [isShrink, setIsShrink] = useState(false);
  const [isGradientActive, setIsGradientActive] = useState(false);
  const containerRef = useRef(null);

  // <audio> 엘리먼트 제어용 ref
  const audioRef = useRef(null);

  const handleStart = () => {
    if (audioRef.current) {
      // 사용자 클릭 이벤트 안에서 play() 호출 → autoplay 정책 통과
      audioRef.current.play().catch(() => console.warn("BGM 재생 실패"));
    }
    setStarted(true);
  };

  const handleScroll = () => {
    /* 기존 스크롤 로직 유지 */
  };

  if (!data) {
    return (
      <div className={styles.loaderWrapper}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <div>
      {/* 시작 전에는 Overlay만 보여주고 onStart에서 play() 호출 */}
      {!started && <SplashOverlay data={data} onStart={handleStart} />}

      <div className={styles.page}>
        <HeaderImage header={data.header} />

        {/* 숨겨진 audio 태그: preload됐지만 play()는 handleStart에서 */}
        {data.bgmUrl && (
          <audio
            ref={audioRef}
            src={data.bgmUrl}
            loop
            muted
            volume="0.5"
            preload="auto"
            style={{ display: "none" }}
          />
        )}

        <div
          className={styles.container}
          ref={containerRef}
          onScroll={handleScroll}
        >
          <Nametag
            data={data}
            isShrink={isShrink}
            isGradientActive={isGradientActive}
          />
          <div className={styles.headercover} />
          <main className={styles.main}>
            {/* ... */}
          </main>
          <footer className={styles.footer}>
            <p style={{ color: "white", fontSize: "xx-small", textAlign: "center" }}>
              e-mail: rct3232@gmail.com
            </p>
          </footer>
        </div>

        <Confetti
          numberOfPieces={30}
          gravity={0.02}
          colors={data.content.confetti.color}
          opacity={0.5}
          drawShape={(ctx) => ctx.fill(new Path2D(data.content.confetti.shape))}
        />

        {/* 시작했다면 음소거 토글 버튼만 보여줌 */}
        {started && data.bgmUrl && <BgmPlayer audioRef={audioRef} />}
      </div>
    </div>
  );
}
