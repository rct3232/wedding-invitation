"use client"

import { useState, useEffect } from "react";

const useWeddingData = () => {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("default");
  const [params, setParams] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathParam = urlParams.get("path");
    const segments = pathParam ? [pathParam] : window.location.pathname.split("/").filter(Boolean);
    const currentQuery = segments[0] || "default";
    setQuery(currentQuery);

    const currentParams = window.location.search;
    setParams(currentParams);

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
          header: `data:image/jpeg;base64,${result.headerImage}`,
        };
        tmpData.content.date = new Date(result.data.content.date);
        tmpData.bgmUrl = "/api/bgm/"+currentQuery;
        setData(tmpData);
      })
      .catch((error) => {
        console.warn("API 호출 에러: ", error);
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
            fallbackData.galleryImage =
              fallbackData.galleryImage || { fullImages: [], thumbImages: [] };
            fallbackData.images =
              fallbackData.images || fallbackData.galleryImage.thumbImages || [];
            fallbackData.bgmUrl = "./fallbackBgm.mp3";
            fallbackData.header = "/fallbackHeader.png";

            setData(fallbackData);
          })
          .catch((fallbackError) => {
            console.error("Fallback 데이터 로드 에러: ", fallbackError);
          });
      });
  }, []);

  return { data, query, params };
}

export default useWeddingData;