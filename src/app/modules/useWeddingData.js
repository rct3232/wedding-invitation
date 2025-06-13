"use client"

import { useState, useEffect } from "react";

export default function useWeddingData() {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("default");

  useEffect(() => {
    const segments = window.location.pathname.split("/").filter(Boolean);
    const currentQuery = segments[0] || "default";
    setQuery(currentQuery);

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

  return { data, query };
}