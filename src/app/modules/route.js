"use client"

import React from "react";
import Map from "./map";
import styles from './route.module.css';

const clientId = process.env.NEXT_PUBLIC_MAP_CLIENT;

const Route = ({ placeInfo }) => {
  const encodedName = encodeURIComponent(placeInfo.address.name);

  return (
    <div className="detail">
      <div className="header">오시는 길</div>
      <div className="list">
        <Map clientId={clientId} mapInfo={placeInfo.map} />
        <div className="little" style={{ marginLeft: "auto" }}>
          {placeInfo.address.address}
        </div>
      </div>
      <div className={styles.mapButtons}>
        <a
          href={`nmap://search?query=${encodedName}&appname=invitation.plume7eat.xyz`}
          aria-label="네이버 지도 열기"
          className={`${styles.mapButton} ${styles.naver}`}
        >
          <span className={styles.iconSmall + ' ' + styles.naverIcon} />
          <span className="little" style={{ marginLeft: "0.7em"}}>네이버지도</span>
        </a>
        <span className={styles.mapButtonDivider}>|</span>
        <a
          href={`kakaomap://search?q=${encodedName}&p=${placeInfo.map.lat},${placeInfo.map.lng}`}
          aria-label="카카오맵 열기"
          className={`${styles.mapButton} ${styles.kakao}`}
        >
          <span className={styles.iconSmall + ' ' + styles.kakaoIcon} />
          <span className="little" style={{ marginLeft: "0.7em"}}>카카오맵</span>
        </a>
        <span className={styles.mapButtonDivider}>|</span>
        <a
          href={`tmap://search?name=${placeInfo.address.name}`}
          aria-label="Tmap 열기"
          className={`${styles.mapButton} ${styles.tmap}`}
        >
          <span className={styles.iconSmall + ' ' + styles.tmapIcon} />
          <span className="little" style={{ marginLeft: "0.7em"}}>Tmap</span>
        </a>
      </div>
      <div className="body">
        {placeInfo.route.map((route, index) => (
          <React.Fragment key={index}>
            <div className="detail">
              <div className="content">{route.type}</div>
              <div className="list">
                {route.content.map((text, idx) => (
                  <div key={idx} className="little" style={{ whiteSpace: "pre-wrap" }}>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default Route;