"use client"

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import styles from "./page.module.css";

import Map from "./modules/map.js";
import Greeting from "./modules/greeting.js"
import DateCounter from "./modules/dateCounter";
import Gallery from "./modules/gallery/gallery";
import BankAccountAccordion from "./modules/bankAccountAccordion";
import Guestbook from "./modules/guestbook";

// prerendering 이슈를 피하기 위해 동적 렌더링 사용 (Next.js 13+)
export const dynamic = "force-dynamic";

const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

const clientId = '9syct7whuf';

export default function Home() {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('default');
  
  useEffect(() => {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const currentQuery = segments[0] || 'default';
    setQuery(currentQuery);

    console.log(currentQuery);

    fetch(`/api/data/${currentQuery}`)
      .then((res) => res.json())
      .then((result) => {
        const tmpData = { ...result.data, images: result.images, header: result.headerImage };
        tmpData.content.date = new Date(result.data.content.date);

        setData(tmpData);
      })
      .catch((error) => console.error('API 호출 에러: ', error));
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <div className={styles.page}>
        <Image src={`data:image/jpeg;base64,${data.header}`} alt="Header picture" fill objectFit="cover" objectPosition="center"/>
        <div className={styles.container}>
          <div className={styles.headercover}/>
          <div className={styles.nametag}>
            <div className={styles.title}>{data.person[0].name.first} 💍 {data.person[1].name.first}</div>
            <div className={styles.detail} style={{alignItems: 'center'}}>
              <div className={styles.little}>{data.content.date.getFullYear()}년 {data.content.date.getMonth()+1}월 {data.content.date.getDate()}일 {dayOfWeek[data.content.date.getDay()]}요일 {data.content.date.getHours()}:{String(data.content.date.getMinutes()).padStart(2, '0')}</div>
              <div className={styles.little}>{data.place.address.name}</div>
            </div>
          </div>
          <main className={styles.main}>
            <div className={styles.divider}/>
            <Greeting greeting={data.content.greeting} relation={data.relation}/>
            <div className={styles.divider}/>

            <div className={styles.content}>
            <DateCounter date={data.content.date}/>
            </div>

            <Gallery 
              fullImages={data.galleryImage.fullImages} 
              thumbImages={data.images} 
              query={query}
            />

            <div className={styles.divider}/>

            <div className={styles.header}>오시는 길</div>
            <div className={styles.detail}>
              <Map clientId={clientId} mapInfo={data.place.map}/>
              <div className={styles.little} style={{marginLeft: 'auto'}}>{data.place.address.address}</div>
            </div>
            <div className={styles.content}>
              {data.place.route.map((route, index) => (
                <React.Fragment key={index}>
                  <div className={styles.body}>{route.type}</div>
                  <div className={styles.detail}>
                    {route.content.map((text, idx) => (
                      <div
                        key={idx}
                        className={styles.little}
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {text}
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div className={styles.divider}/>
            <BankAccountAccordion accountInfo={data.account}/>
            <div className={styles.divider}/>
            <Guestbook query={query}/>

          </main>
          <footer className={styles.footer}>
            <p style={{color: 'white', fontSize: 'xx-small', textAlign: 'center'}}>e-mail: rct3232@gmail.com</p>
          </footer>
        </div>
      </div>
    </div>
  );
}