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
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    if (containerRef.current) setContainerWidth(containerRef.current.clientWidth)
  }, []);

  const [currentIndex, setCurrentIndex] = useState(index);
  const [imageCache, setImageCache] = useState({});
  const [imageLoaded, setImageLoaded] = useState({});

  useEffect(() => {
    const filename = fullImages[currentIndex];
    if (!filename) return;
    if (imageCache[filename]) {
      setImageLoaded((prev) => ({ ...prev, [filename]: true }));
    } else {
      fetch(`/api/image/${query}/${filename}`)
        .then((response) => {
          if (!response.ok) throw new Error("Network error");
          return response.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setImageCache((prev) => ({ ...prev, [filename]: url }));
          setImageLoaded((prev) => ({ ...prev, [filename]: true }));
        })
        .catch((err) => console.error("Error fetching image:", err));
    }
  }, [currentIndex, fullImages, query, imageCache]);

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
  }, [currentIndex]);

  const [dragOffset, setDragOffset] = useState(0);
  const [transitionValue, setTransitionValue] = useState({ isTrans: false, type: null}); // null, "restore", "switch"
  const [transitionPos, setTransitionPos] = useState({in: 0, out: 0});

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const dragging = useRef(false);
  const swipedRef = useRef(false);

  const threshold = 50;

  const handleTouchStart = (e) => {
    if (transitionValue.isTrans) return;
    dragging.current = true;
    swipedRef.current = false;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!dragging.current || transitionValue.isTrans) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - touchStartX.current;
    if (Math.abs(diffX) > 10) {
      swipedRef.current = true;
    }
    setDragOffset(diffX);
  };

  const handleTouchEnd = (e) => {
    if (!dragging.current || transitionValue.isTrans) return;
    dragging.current = false;
    const absOffset = Math.abs(dragOffset);
    if (absOffset < threshold) {
      setTransitionValue({ isTrans: true, type: "restore" });
      setTimeout(() => {
        setDragOffset(0);
      }, 10);
      setTimeout(() => {
        setTransitionValue({ isTrans: false, type: null });
      }, 300);
      onClose();
    } else {
      const direction = dragOffset < 0 ? "next" : "prev";
      let newIndex = currentIndex + (direction === "next" ? 1 : -1);
      if (newIndex < 0 || newIndex >= fullImages.length) {
        setTransitionValue({ isTrans: true, type: "restore" });
        setTimeout(() => {
          setDragOffset(0);
        }, 10);
        setTimeout(() => {
          setTransitionValue({ isTrans: false, type: null });
        }, 300);
        return;
      }
      setTransitionValue({ isTrans: true, type: "switch" });
      setTransitionPos({ in: direction === "next" ? containerWidth : -containerWidth, out: dragOffset });
      setTimeout(() => {
        setTransitionPos({ in: 0, out: direction === "next" ? -containerWidth : containerWidth });
      }, 10);
      setTimeout(() => {
        setCurrentIndex(newIndex);
        setDragOffset(0);
        setTransitionValue({ isTrans: false, type: null });
        setTransitionPos({ in: 0, out: 0 })
        if (direction === "next" && onNext) onNext();
        if (direction === "prev" && onPrev) onPrev();
      }, 310);
    }
  };

  const handleClick = (e) => {
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    onClose();
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (transitionValue.isTrans) return;
    setDragOffset(containerWidth);
    setTimeout(() => {
      setTransitionValue({ isTrans: true, type: "switch" });
      setTransitionPos({ in: -containerWidth, out: containerWidth });
      setTimeout(() => {
        setTransitionPos({ in: 0, out: containerWidth });
      }, 10);
      setTimeout(() => {
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        setDragOffset(0);
        setTransitionValue({ isTrans: false, type: null });
        setTransitionPos({ in: 0, out: 0 });
        if (onPrev) onPrev();
      }, 310);
    }, 0);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (transitionValue.isTrans) return;
    setDragOffset(-containerWidth);
    setTimeout(() => {
      setTransitionValue({ isTrans: true, type: "switch" });
      setTransitionPos({ in: containerWidth, out: -containerWidth })
      setTimeout(() => {
        setTransitionPos({ in: 0, out: -containerWidth });
      }, 10);
      setTimeout(() => {
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
        setDragOffset(0);
        setTransitionValue({ isTrans: false, type: null });
        setTransitionPos({ in: 0, out: 0 });
        if (onNext) onNext();
      }, 310);
    }, 0);
  };

  let renderedContent;
  if (transitionValue.type === "switch") {
    const direction = dragOffset < 0 ? "next" : "prev";
    const newIndex = currentIndex + (direction === "next" ? 1 : -1);
    const outgoingSrc = imageCache[fullImages[currentIndex]] || "";
    const incomingSrc = imageCache[fullImages[newIndex]] || "";
    renderedContent = (
      <div
        className={styles.enlargedContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          className={styles.largeImage}
          src={outgoingSrc}
          alt={`Image ${currentIndex + 1}`}
          loading="lazy"
          style={{
            transform: `translateX(${transitionPos.out}px)`,
            transition: "transform 300ms ease",
          }}
        />
        <img
          className={styles.largeImage}
          src={incomingSrc}
          alt={`Image ${newIndex + 1}`}
          loading="lazy"
          style={{
            transform: `translateX(${transitionPos.in}px)`,
            transition: "transform 300ms ease",
          }}
        />
        {!imageLoaded[fullImages[currentIndex]] && (
          <div className={styles.loader}></div>
        )}
      </div>
    );
  } else {
    const currentSrc = imageCache[fullImages[currentIndex]] || "";
    renderedContent = (
      <div
        className={styles.enlargedContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          className={styles.largeImage}
          src={currentSrc}
          alt={`Image ${currentIndex + 1}`}
          loading="lazy"
          onLoad={() => setImageLoaded((prev) => ({ ...prev, [fullImages[currentIndex]]: true }))}
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: transitionValue.isTrans && transitionValue.type === "restore"
              ? "transform 300ms ease"
              : "none",
            visibility: imageLoaded[fullImages[currentIndex]]
              ? "visible"
              : "hidden",
          }}
        />
        {!imageLoaded[fullImages[currentIndex]] && (
          <div className={styles.loader}></div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={handleClick}>
      <div
        className={styles.content}
        ref={containerRef}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {renderedContent}
        {currentIndex > 0 && !transitionValue.isTrans && (
          <button
            className={styles.prev}
            onClick={(e) => {
              e.stopPropagation();
              handlePrev(e);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {"<"}
          </button>
        )}
        {currentIndex < fullImages.length - 1 && !transitionValue.isTrans && (
          <button
            className={styles.next}
            onClick={(e) => {
              e.stopPropagation();
              handleNext(e);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {">"}
          </button>
        )}
        <div
          className={styles.thumbnailBar}
          ref={thumbRef}
          onClick={(e) => e.stopPropagation()}
        >
          {thumbImages.map((img, i) => (
            <div
              key={i}
              className={`${styles.thumbnail} ${i === currentIndex ? styles.activeThumbnail : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(i);
                setCurrentIndex(i);
              }}
            >
              <img
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