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
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
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
      const active = thumbRef.current.querySelector(
        `.${styles.activeThumbnail}`
      );
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState(null); // null, "restore", "switch"
  const [outgoingX, setOutgoingX] = useState(0);
  const [incomingX, setIncomingX] = useState(0);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const dragging = useRef(false);
  const swipedRef = useRef(false);

  const threshold = 50;

  const handleTouchStart = (e) => {
    if (isTransitioning) return;
    dragging.current = true;
    swipedRef.current = false;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!dragging.current || isTransitioning) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - touchStartX.current;
    if (Math.abs(diffX) > 10) {
      swipedRef.current = true;
    }
    setDragOffset(diffX);
  };

  const handleTouchEnd = (e) => {
    if (!dragging.current || isTransitioning) return;
    dragging.current = false;
    const absOffset = Math.abs(dragOffset);
    if (absOffset < threshold) {
      setTransitionType("restore");
      setIsTransitioning(true);
      setTimeout(() => {
        setDragOffset(0);
      }, 10);
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionType(null);
      }, 300);
    } else {
      const direction = dragOffset < 0 ? "next" : "prev";
      let newIndex = currentIndex + (direction === "next" ? 1 : -1);
      if (newIndex < 0 || newIndex >= fullImages.length) {
        setTransitionType("restore");
        setIsTransitioning(true);
        setTimeout(() => {
          setDragOffset(0);
        }, 10);
        setTimeout(() => {
          setIsTransitioning(false);
          setTransitionType(null);
        }, 300);
        return;
      }
      setTransitionType("switch");
      setIsTransitioning(true);
      setOutgoingX(dragOffset);
      setIncomingX(direction === "next" ? containerWidth : -containerWidth);
      setTimeout(() => {
        setOutgoingX(direction === "next" ? -containerWidth : containerWidth);
        setIncomingX(0);
      }, 10);
      setTimeout(() => {
        setCurrentIndex(newIndex);
        setDragOffset(0);
        setIsTransitioning(false);
        setTransitionType(null);
        setOutgoingX(0);
        setIncomingX(0);
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
    if (isTransitioning) return;
    setDragOffset(containerWidth);
    setTimeout(() => {
      setTransitionType("switch");
      setIsTransitioning(true);
      setOutgoingX(containerWidth);
      setIncomingX(-containerWidth);
      setTimeout(() => {
        setOutgoingX(containerWidth);
        setIncomingX(0);
      }, 10);
      setTimeout(() => {
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        setDragOffset(0);
        setIsTransitioning(false);
        setTransitionType(null);
        setOutgoingX(0);
        setIncomingX(0);
        if (onPrev) onPrev();
      }, 310);
    }, 0);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (isTransitioning) return;
    setDragOffset(-containerWidth);
    setTimeout(() => {
      setTransitionType("switch");
      setIsTransitioning(true);
      setOutgoingX(-containerWidth);
      setIncomingX(containerWidth);
      setTimeout(() => {
        setOutgoingX(-containerWidth);
        setIncomingX(0);
      }, 10);
      setTimeout(() => {
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
        setDragOffset(0);
        setIsTransitioning(false);
        setTransitionType(null);
        setOutgoingX(0);
        setIncomingX(0);
        if (onNext) onNext();
      }, 310);
    }, 0);
  };

  let renderedContent;
  if (transitionType === "switch") {
    const direction = dragOffset < 0 ? "next" : "prev";
    const newIndex = currentIndex + (direction === "next" ? 1 : -1);
    const outgoingSrc = imageCache[fullImages[currentIndex]] || "";
    const incomingSrc = imageCache[fullImages[newIndex]] || "";
    renderedContent = (
      <div
        className={styles.enlargedContainer}
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", overflow: "hidden" }}
      >
        <img
          src={outgoingSrc}
          alt={`Image ${currentIndex + 1}`}
          loading="lazy"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `translateX(${outgoingX}px)`,
            transition: "transform 300ms ease",
          }}
        />
        <img
          src={incomingSrc}
          alt={`Image ${newIndex + 1}`}
          loading="lazy"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `translateX(${incomingX}px)`,
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
        style={{ position: "relative", overflow: "hidden" }}
      >
        <img
          src={currentSrc}
          alt={`Image ${currentIndex + 1}`}
          loading="lazy"
          onLoad={() =>
            setImageLoaded((prev) => ({
              ...prev,
              [fullImages[currentIndex]]: true,
            }))
          }
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `translateX(${dragOffset}px)`,
            transition:
              isTransitioning && transitionType === "restore"
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
    <div className={styles.overlay}>
      <div
        className={styles.content}
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {renderedContent}
        {currentIndex > 0 && !isTransitioning && (
          <button
            className={styles.prev}
            onClick={(e) => {
              e.stopPropagation();
              handlePrev(e);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            style={{ paddingTop: "20px", paddingBottom: "20px", minWidth: "50px" }}
          >
            {"<"}
          </button>
        )}
        {currentIndex < fullImages.length - 1 && !isTransitioning && (
          <button
            className={styles.next}
            onClick={(e) => {
              e.stopPropagation();
              handleNext(e);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            style={{ paddingTop: "20px", paddingBottom: "20px", minWidth: "50px" }}
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
              className={`${styles.thumbnail} ${
                i === currentIndex ? styles.activeThumbnail : ""
              }`}
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