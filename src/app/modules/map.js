'use client'

import React, { useEffect } from 'react';

const Map = ({ clientId, mapInfo }) => {
  useEffect(() => {
    const initMap = () => {
      const mapOptions = {
        center: new naver.maps.LatLng(mapInfo.center.lat, mapInfo.center.lng),
        zoom: mapInfo.zoom,
        scrollWheel: false,
        keyboardShortcuts: false,
        zoomControl: true,
        zoomControlOptions: {
          style: naver.maps.ZoomControlStyle.SMALL,
          position: naver.maps.Position.TOP_RIGHT
        }
      };

      new naver.maps.Marker({position: new naver.maps.LatLng(mapInfo.pos.lat, mapInfo.pos.lng),map: new naver.maps.Map('map', mapOptions)});
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

export default Map;