"use client"

import React from "react";
import Map from "./map";

const clientId = process.env.NEXT_PUBLIC_MAP_CLIENT;

const Route = ({ placeInfo }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px"}}>
      <div className="header">오시는 길</div>
      <div className="detail">
        <Map clientId={clientId} mapInfo={placeInfo.map} />
        <div className="little" style={{ marginLeft: "auto" }}>
          {placeInfo.address.address}
        </div>
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