import React, { useEffect, useRef } from "react";
import styles from "./gallery.module.css";

const EnlargedOverlay = ({ images, index, onClose, onNext, onPrev, onSelect }) => {
  const thumbRef = useRef(null);

  useEffect(() => {
    if (thumbRef.current) {
      const active = thumbRef.current.querySelector(`.${styles.activeThumbnail}`);
      if (active) {
        active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [index]);

  return (
    // .overlay는 전체 화면을 덮으며, 클릭 시 onClose가 호출됩니다.
    <div className={styles.overlay} onClick={onClose}>
      {/* 콘텐츠 영역은 wrapper로, 콘텐츠 영역 외 클릭은 onClose로 전달되도록 함 */}
      <div className={styles.contentWrapper} onClick={(e) => e.stopPropagation()}>
        <div className={styles.enlargedContainer}>
          {index > 0 && (
            <button
              className={styles.prev}
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
            >
              ⬅
            </button>
          )}
          <img
            src={images[index]}
            className={styles.largeImage}
            alt={`Enlarged Image ${index + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
          {index < images.length - 1 && (
            <button
              className={styles.next}
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
            >
              ➡
            </button>
          )}
        </div>
        <div
          className={styles.thumbnailBar}
          ref={thumbRef}
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((src, i) => (
            <div
              key={i}
              className={`${styles.thumbnail} ${
                i === index ? styles.activeThumbnail : ""
              }`}
              onClick={() => onSelect(i)}
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
