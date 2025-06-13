"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./page.module.css";

import Map from "./modules/map.js";
import Greeting from "./modules/greeting.js";
import DateCounter from "./modules/dateCounter";
import Gallery from "./modules/gallery/gallery";
import BankAccountAccordion from "./modules/bankAccountAccordion";
import Guestbook from "./modules/guestbook";

export const dynamic = "force-dynamic";

const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
const clientId = process.env.NEXT_PUBLIC_MAP_CLIENT;

export default function Home() {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("default");
  const [isShrink, setIsShrink] = useState(false);
  const [isGradientActive, setIsGradientActive] = useState(false);
  
  // splash 오버레이 제어를 위한 상태들
  const [showSplash, setShowSplash] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);

  const containerRef = useRef(null);

  useEffect(() => {
    // splash 애니메이션: 3초 후(splashVisible=false) fade out, 4초 후 오버레이 제거
    const timer1 = setTimeout(() => {
      setSplashVisible(false);
    }, 4000);
    const timer2 = setTimeout(() => {
      setShowSplash(false);
    }, 5000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    const segments = window.location.pathname.split("/").filter(Boolean);
    const currentQuery = segments[0] || "default";
    setQuery(currentQuery);

    console.log("Current Query:", currentQuery);

    fetch(`/api/data/${currentQuery}`)
      .then((res) => {
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }
        return res.json();
      })
      .then((result) => {
        const tmpData = {
          ...result.data,
          images: result.images,
          header: result.headerImage,
        };
        tmpData.content.date = new Date(result.data.content.date);
        console.log(tmpData);
        setData(tmpData);
      })
      .catch((error) => {
        console.error("API 호출 에러: ", error);
        fetch("/fallbackData.json")
          .then((res) => {
            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
              throw new Error("Fallback response is not JSON");
            }
            return res.json();
          })
          .then((fallbackData) => {
            fallbackData.content.date = new Date(fallbackData.content.date);
            fallbackData.header = fallbackData.header || "";
            fallbackData.galleryImage =
              fallbackData.galleryImage || { fullImages: [], thumbImages: [] };
            fallbackData.images =
              fallbackData.images || fallbackData.galleryImage.thumbImages || [];
            setData(fallbackData);
          })
          .catch((fallbackError) => {
            console.error("Fallback 데이터 로드 에러: ", fallbackError);
          });
      });
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const baseThreshold = window.innerWidth <= 600 ? (window.innerHeight - 146) : 525;
      const margin = 66;
      const shrinkThreshold = baseThreshold;
      const releaseThreshold = baseThreshold - margin;
  
      if (!isShrink && scrollTop >= shrinkThreshold) {
        setIsShrink(true);
      } else if (isShrink && scrollTop <= releaseThreshold) {
        setIsShrink(false);
      }
  
      const gradientThreshold = window.innerWidth <= 600 ? (window.innerHeight - 200) : 600;
      if (!isGradientActive && scrollTop >= gradientThreshold) {
        setIsGradientActive(true);
      } else if (isGradientActive && scrollTop < gradientThreshold) {
        setIsGradientActive(false);
      }
    }
  };

  if (!data)
    return (
      <div className={styles.loaderWrapper}>
        <div className={styles.loader}></div>
      </div>
    );

  return (
    <div>
      {/* Splash 오버레이 */}
      {showSplash && (
        <div className={`${styles.splash} ${!splashVisible ? styles.hide : ""}`}>
          <div className={styles["splash-text"]}>
            {data.person[0].name.kor.last}{data.person[0].name.kor.first} 💛 {data.person[1].name.kor.last}{data.person[1].name.kor.first}
          </div>
          <div className={`${styles["splash-text"]} ${styles.line2}`}>we&apos;re getting married</div>
        </div>
      )}
      <div className={styles.page}>
        <Image
          src={`data:image/jpeg;base64,${data.header}`}
          alt="Header picture"
          fill
          objectFit="cover"
          objectPosition="center"
        />
        <div className={styles.container} ref={containerRef} onScroll={handleScroll}>
          <div className={`${styles.nametag} ${isShrink ? styles.shrink : ""} ${isGradientActive ? styles.gradientActive : ""}`}>
            <div className={styles.title}>
              {data.person[0].name.eng.first} &amp; {data.person[1].name.eng.first}
            </div>
            <div className={styles.detail} style={{ alignItems: "center" }}>
              <div className={styles.little}>
                {data.content.date.getFullYear()}년{" "}
                {data.content.date.getMonth() + 1}월{" "}
                {data.content.date.getDate()}일{" "}
                {dayOfWeek[data.content.date.getDay()]}요일{" "}
                {data.content.date.getHours()}:
                {String(data.content.date.getMinutes()).padStart(2, "0")}
              </div>
              <div className={styles.little}>{data.place.address.name}</div>
            </div>
          </div>
          <div className={styles.headercover} />
          <main className={styles.main}>
            <div style={{ height: "66px" }} />
            <div className={styles.divider} />
            <Greeting greeting={data.content.greeting} relation={data.relation} />
            <div className={styles.divider} />
            <div className={styles.content}>
              <DateCounter date={data.content.date} />
            </div>
            <Gallery
              fullImages={data.galleryImage.fullImages}
              thumbImages={data.images}
              query={query}
            />
            <div className={styles.divider} />
            <div className={styles.header}>오시는 길</div>
            <div className={styles.detail}>
              <Map clientId={clientId} mapInfo={data.place.map} />
              <div className={styles.little} style={{ marginLeft: "auto" }}>
                {data.place.address.address}
              </div>
            </div>
            <div className={styles.content}>
              {data.place.route.map((route, index) => (
                <React.Fragment key={index}>
                  <div className={styles.body}>{route.type}</div>
                  <div className={styles.detail}>
                    {route.content.map((text, idx) => (
                      <div key={idx} className={styles.little} style={{ whiteSpace: "pre-wrap" }}>
                        {text}
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className={styles.divider} />
            <BankAccountAccordion accountInfo={data.account} />
            <div className={styles.divider} />
            <Guestbook query={query} />
          </main>
          <footer className={styles.footer}>
            <p style={{ color: "white", fontSize: "xx-small", textAlign: "center" }}>
              e-mail: rct3232@gmail.com
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}