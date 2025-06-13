// page.js
"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";

import SplashOverlay from "./modules/splashOverlay";
import HeaderImage from "./modules/headerImage";
import Nametag from "./modules/nametag";
import Greeting from "./modules/greeting";
import DateCounter from "./modules/dateCounter";
import Gallery from "./modules/gallery/gallery";
import Route from "./modules/route";
import BankAccountAccordion from "./modules/bankAccountAccordion";
import Guestbook from "./modules/guestbook";

import useWeddingData from "./modules/useWeddingData";

export const dynamic = "force-dynamic";

export default function Home() {
  const { data, query } = useWeddingData();
  const [isShrink, setIsShrink] = useState(false);
  const [isGradientActive, setIsGradientActive] = useState(false);

  const containerRef = useRef(null);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const baseThreshold =
        window.innerWidth <= 600 ? window.innerHeight - 146 : 525;
      const margin = 66;
      const shrinkThreshold = baseThreshold;
      const releaseThreshold = baseThreshold - margin;

      if (!isShrink && scrollTop >= shrinkThreshold) {
        setIsShrink(true);
      } else if (isShrink && scrollTop <= releaseThreshold) {
        setIsShrink(false);
      }

      const gradientThreshold =
        window.innerWidth <= 600 ? window.innerHeight - 200 : 600;
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
            <div style={{ height: "66px" }} />
            <div className={styles.divider} />
            <Greeting greeting={data.content.greeting} relation={data.relation} />
            <div className={styles.divider} />
            <DateCounter date={data.content.date} />
            <Gallery fullImages={data.galleryImage.fullImages} thumbImages={data.images} query={query} />
            <div className={styles.divider} />
            <Route placeInfo={data.place}/>
            <div className={styles.divider} />
            <BankAccountAccordion accountInfo={data.account} />
            <div className={styles.divider} />
            <Guestbook query={query} />
          </main>
          <footer className={styles.footer}>
            <p style={{ color: "white", fontSize: "xx-small", textAlign: "center", }}>
              e-mail: rct3232@gmail.com
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}