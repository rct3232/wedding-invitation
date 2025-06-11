"use client"

import React, { useEffect, useRef, useState } from "react";
import styles from "./gallery.module.css";

const EnlargedOverlay = ({
  fullImages,
  thumbImages,
  index,
  query,
  onClose,
  onNext,
  onPrev,
  onSelect,
}) => {
  const thumbRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  // imageCache: { [filename]: objectURL }
  const [imageCache, setImageCache] = useState({});

  // 인덱스가 변경될 때마다 새 이미지 요청 (이미 캐시되어 있으면 재요청하지 않음)
  useEffect(() => {
    setImageLoaded(false);
    const filename = fullImages[index];
    if (!filename) return;

    if (imageCache[filename]) {
      // 캐시된 object URL이 있으면 바로 완료
      setImageLoaded(true);
    } else {
      // 새로 요청: /api/image/:query/:image
      fetch(`/api/image/${query}/${filename}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setImageCache((prev) => ({ ...prev, [filename]: url }));
          setImageLoaded(true);
        })
        .catch((error) => {
          console.error("Error fetching full image:", error);
        });
    }
  }, [index, fullImages, query, imageCache]);

  useEffect(() => {
    if (thumbRef.current) {
      const active = thumbRef.current.querySelector(`.${styles.activeThumbnail}`);
      if (active) {
        active.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [index]);

  return (
    <div className={styles.overlay}>
      <div
        className={styles.content}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <div
          className={styles.enlargedContainer}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          {!imageLoaded && <div className={styles.loader}></div>}
          <img
            // src로 캐시된 URL을 사용합니다.
            src={imageCache[fullImages[index]] || ""}
            className={styles.largeImage}
            alt={`Enlarged Image ${index + 1}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onClick={(e) => e.stopPropagation()}
            style={{ visibility: imageLoaded ? "visible" : "hidden" }}
          />
        </div>

        {index > 0 && (
          <button
            className={styles.prev}
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            {"<"}
          </button>
        )}
        {index < fullImages.length - 1 && (
          <button
            className={styles.next}
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            {">"}
          </button>
        )}

        {/* 썸네일 바 */}
        <div
          className={styles.thumbnailBar}
          ref={thumbRef}
          onClick={(e) => e.stopPropagation()}
        >
          {thumbImages.map((img, i) => (
            <div
              key={i}
              className={`${styles.thumbnail} ${
                i === index ? styles.activeThumbnail : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(i);
              }}
            >
              <img
                // base64 데이터를 data URI 형식으로 사용
                src={`data:image/jpeg;base64,${img.content}`}
                alt={`Thumbnail ${i + 1}`}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnlargedOverlay;
