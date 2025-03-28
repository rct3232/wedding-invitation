'use client'

import React, { useEffect } from 'react';

const clientId = '9syct7whuf';

export default function Map() {
  useEffect(() => {
    const initMap = () => {
      const mapOptions = {
        center: new naver.maps.LatLng(37.5934323, 127.0017147),
        zoom: 14,
        scrollWheel: false,
        keyboardShortcuts: false,
        zoomControl: true, //줌 컨트롤의 표시 여부
        zoomControlOptions: { //줌 컨트롤의 옵션
          style: naver.maps.ZoomControlStyle.SMALL,
          position: naver.maps.Position.TOP_RIGHT
        }
      };

      new naver.maps.Marker({position: new naver.maps.LatLng(37.5964866, 126.9971402),map: new naver.maps.Map('map', mapOptions)});
    };

    if (window.naver && window.naver.maps) {
      initMap();
    } else {
      const mapScript = document.createElement('script');
      mapScript.onload = () => initMap();
      mapScript.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
      document.head.appendChild(mapScript);
    }
  }, []);

  return (
      <div id="map" style={{ width: '100%', aspectRatio: '1/1' }}/>
  );
}