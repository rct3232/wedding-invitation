import React, { useEffect, useRef, useState } from "react";
import styles from "./gallery.module.css";

const EnlargedOverlay = ({
  fullImages,
  thumbImages,
  index,
  onClose,
  onNext,
  onPrev,
  onSelect,
}) => {
  const thumbRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // index 변경 시 로딩 상태 초기화
  useEffect(() => {
    setImageLoaded(false);
  }, [index]);

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
            src={fullImages[index]}
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
          {thumbImages.map((src, i) => (
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
              <img src={src} alt={`Thumbnail ${i + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnlargedOverlay;
