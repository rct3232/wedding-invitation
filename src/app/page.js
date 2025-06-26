// page.js
"use client";

import React, { useState, useEffect, useRef } from "react";
import Confetti from 'react-confetti';
import styles from "./page.module.css";

import SplashOverlay from "./modules/splashOverlay";
import ConfettiPile from "./modules/ConfettiPile"; // Import the new component
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
  const { data, query, params } = useWeddingData();
  const [isShrink, setIsShrink] = useState(false);
  const [isGradientActive, setIsGradientActive] = useState(false);
  const [hideBankSection, setHideBankSection] = useState(false);
  const [currentPileSize, setCurrentPileSize] = useState(0); // State for pile size
  const [windowSize, setWindowSize] = useState({ width: undefined, height: undefined });

  const containerRef = useRef(null);

  // Get window size for canvas dimensions
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    window.addEventListener("resize", handleResize);
    handleResize(); // Call handler right away so state is updated with initial window size
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const modeParam = new URLSearchParams(params).get('mode');
    if (modeParam){
      try {
        const uriDecoded = decodeURIComponent(modeParam);
        const b64 = uriDecoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(uriDecoded.length / 4) * 4, "=");
        if (atob(b64) == "noAccount") setHideBankSection(true);
      } catch (e) {
        console.error("base64 decode failed:", e);
      }
    }
  }, [query]);

  // Effect to grow the pile size over time
  useEffect(() => {
    if (data && data.content && data.content.confetti) { // Ensure data is loaded
      // Current react-confetti is set to recycle=true (default)
      // So, we'll grow the pile over a few seconds and then keep it.
      if (currentPileSize < 100) {
        const timer = setTimeout(() => {
          setCurrentPileSize(prevSize => Math.min(prevSize + 2, 100)); // Slower, smoother increment
        }, 200); // Interval for growth
        return () => clearTimeout(timer);
      }
    }
  }, [currentPileSize, data]);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const baseThreshold =
        window.innerWidth <= 600 ? window.innerHeight : 525;
      const margin = 66;
      const shrinkThreshold = baseThreshold;
      const releaseThreshold = baseThreshold - margin;

      if (!isShrink && scrollTop >= shrinkThreshold) {
        setIsShrink(true);
      } else if (isShrink && scrollTop <= releaseThreshold) {
        setIsShrink(false);
      }

      const gradientThreshold =
        window.innerWidth <= 600 ? window.innerHeight : 525;
      if (!isGradientActive && scrollTop >= gradientThreshold) {
        setIsGradientActive(true);
      } else if (isGradientActive && scrollTop < gradientThreshold) {
        setIsGradientActive(false);
      }
    }
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
      <SplashOverlay data={data} />
      <div className={styles.page}>
        <HeaderImage header={data.header} />
        <div className={styles.container} ref={containerRef} onScroll={handleScroll}>
          <Nametag data={data} isShrink={isShrink} isGradientActive={isGradientActive} />
          <div className={styles.headercover} />
          <main className={styles.main}>
            <div className={styles.divider} />
            <Greeting greeting={data.content.greeting} relation={data.relation} />
            <div className={styles.divider} />
            <DateCounter date={data.content.date} />
            <HighlightCalendar selectedDate={data.content.date} />
            <Gallery fullImages={data.galleryImage.fullImages} thumbImages={data.images} query={query} />
            <div className={styles.divider} />
            <Route placeInfo={data.place}/>
            {!hideBankSection && (
              <>
                <div className={styles.divider} />
                <BankAccountAccordion accountInfo={data.account} />
              </>
            )}
            <div className={styles.divider} />
            <Guestbook query={query} />
          </main>
          <footer className={styles.footer}>
            <p style={{ color: "white", fontSize: "xx-small", textAlign: "center", }}>
              e-mail: rct3232@gmail.com
            </p>
          </footer>
        </div>
        <Confetti
          numberOfPieces={30}
          gravity={0.02}
          colors={data.content.confetti.color}
          opacity={0.5}
          drawShape={ctx => ctx.fill(new Path2D(data.content.confetti.shape))}
          recycle={true} // Explicitly keep recycle true
          width={windowSize.width} // Use window size for react-confetti as well
          height={windowSize.height}
        />
        {data.content.confetti && windowSize.width && (
          <ConfettiPile
            pileSize={currentPileSize}
            colors={data.content.confetti.color}
            shapeSVGPath={data.content.confetti.shape}
            canvasWidth={windowSize.width}
            targetPileHeight={100} // Adjust as needed, e.g., 100px
          />
        )}
        {data.bgmUrl && <BgmPlayer bgmUrl={data.bgmUrl} />}
      </div>
    </div>
  );
}