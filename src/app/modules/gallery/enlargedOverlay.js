// modules/EnlargedOverlay.js
"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./gallery.module.css";

export default function EnlargedOverlay({
  fullImages,
  thumbImages,
  index,
  query,
  onClose,
  onNext,
  onPrev,
  onSelect,
}) {
  const containerRef = useRef(null);
  const thumbRef = useRef(null);

  // ---- 기본 상태들 ----
  const [currentIndex, setCurrentIndex] = useState(index);
  const [imageCache, setImageCache] = useState({});
  const [imageLoaded, setImageLoaded] = useState({});

  // 슬라이드 애니메이션용 상태
  const [isAnimating, setIsAnimating] = useState(false);
  const [nextIndex, setNextIndex] = useState(null);
  const [slideDir, setSlideDir] = useState(null); // "next" or "prev"
  const [animOffsets, setAnimOffsets] = useState({ out: 0, in: 0 });
  const [containerWidth, setContainerWidth] = useState(0);

  // 터치 스와이프 관련 refs
  const touchStartX = useRef(0);
  const dragging = useRef(false);
  const swipedRef = useRef(false);
  const threshold = 50;

  // 1) 컨테이너 너비 구하기
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
  }, []);

  // 2) currentIndex 바뀔 때 이미지 preload
  useEffect(() => {
    const file = fullImages[currentIndex];
    if (!file) return;
    if (imageCache[file]) {
      setImageLoaded((p) => ({ ...p, [file]: true }));
      return;
    }
    fetch(`/api/image/${query}/${file}`)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        setImageCache((p) => ({ ...p, [file]: url }));
        setImageLoaded((p) => ({ ...p, [file]: true }));
      })
      .catch(console.error);
  }, [currentIndex, fullImages, query, imageCache]);

  // 3) 썸네일 중앙 스크롤
  useEffect(() => {
    if (!thumbRef.current) return;
    const bar = thumbRef.current;
    const active = bar.querySelector('.active-thumbnail');
    if (active) {
      const barWidth = bar.clientWidth;
      const activeLeft = active.offsetLeft;
      const activeWidth = active.offsetWidth;
      const scrollTo = activeLeft - (barWidth / 2) + (activeWidth / 2);
      const maxScroll = bar.scrollWidth - barWidth;
      bar.scrollTo({
        left: Math.max(0, Math.min(scrollTo, maxScroll)),
        behavior: "smooth"
      });
    }
  }, [currentIndex]);

  // 4) 슬라이드 애니메이션 시작 함수
  const startSlide = (dir) => {
    if (isAnimating) return;
    let ni = dir === "next" ? currentIndex + 1 : currentIndex - 1;

    // 순환 로직 추가
    if (ni < 0) ni = fullImages.length - 1;
    if (ni >= fullImages.length) ni = 0;

    setNextIndex(ni);
    setSlideDir(dir);
    setIsAnimating(true);

    // 4-1) 첫 단계: outgoing=0, incoming=±width
    setAnimOffsets({
      out: 0,
      in: dir === "next" ? containerWidth : -containerWidth,
    });

    // 4-2) 다음 틱에서 목표 위치로 이동
    setTimeout(() => {
      setAnimOffsets({
        out: dir === "next" ? -containerWidth : containerWidth,
        in: 0,
      });
    }, 20);
  };

  // 5) transition 끝났을 때 상태 정리
  const onImageTransitionEnd = () => {
    if (!isAnimating) return;

    setCurrentIndex(nextIndex);
    setNextIndex(null);
    setSlideDir(null);
    setIsAnimating(false);
    setAnimOffsets({ out: 0, in: 0 });

    if (slideDir === "next") onNext?.();
    if (slideDir === "prev") onPrev?.();
  };

  // 6) 버튼 핸들러
  const handlePrev = (e) => {
    e.stopPropagation();
    startSlide("prev");
  };
  const handleNext = (e) => {
    e.stopPropagation();
    startSlide("next");
  };

  // 7) 터치 스와이프 (기존 로직 그대로)
  const handleTouchStart = (e) => {
    if (isAnimating) return;
    dragging.current = true;
    swipedRef.current = false;
    touchStartX.current = e.touches[0].clientX;
    setAnimOffsets({ out: 0, in: 0 });
  };
  const handleTouchMove = (e) => {
    if (!dragging.current || isAnimating) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 10) swipedRef.current = true;
    // 임시로 one-image 드래그 이펙트
    setAnimOffsets({ out: dx, in: 0 });
  };
  const handleTouchEnd = () => {
    if (!dragging.current || isAnimating) return;
    dragging.current = false;
    const dx = animOffsets.out;
    if (Math.abs(dx) < threshold) {
      // 복원
      setAnimOffsets({ out: 0, in: 0 });
      return;
    }
    // 스와이프와 동일하게 애니메이션 재생
    const dir = dx < 0 ? "next" : "prev";
    startSlide(dir);
  };

  // 8) 이미지 렌더링
  const renderImages = () => {
    const outFile = fullImages[currentIndex];
    const outSrc = imageCache[outFile] || "";
    const inFile = nextIndex != null ? fullImages[nextIndex] : null;
    const inSrc = inFile ? imageCache[inFile] : "";

    // ── 애니메이션 중일 때 (2개 이미지 슬라이드) ──
    if (isAnimating && nextIndex != null) {
      return (
        <div className={styles.enlargedContainer}>
          <img
            className={styles.largeImage}
            src={outSrc}
            style={{ transform: `translateX(${animOffsets.out}px)` }}
          />
          <img
            className={styles.largeImage}
            src={inSrc}
            style={{ transform: `translateX(${animOffsets.in}px)` }}
            onTransitionEnd={onImageTransitionEnd}
          />
        </div>
      );
    }

    // ── Static 렌더: 단일 이미지, transition 끔 ──
    return (
      <div className={styles.enlargedContainer}>
        <img
          className={`${styles.largeImage} ${styles["no-transition"]}`}
          src={outSrc}
          alt=""
          onLoad={() =>
            setImageLoaded((p) => ({ ...p, [outFile]: true }))
          }
          style={{ transform: 'translateX(0px)' }}
        />
        {!imageLoaded[outFile] && <div className={styles.loader} />}
      </div>
    );
  };

  // 썸네일 바 렌더링 수정
  const renderThumbnails = () => {
    return thumbImages.map((img, i) => (
      <div
        key={i}
        className={`${styles.thumbnail} ${i === currentIndex ? styles.activeThumbnail + " active-thumbnail" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setCurrentIndex(i);
          onSelect(i);
        }}
      >
        <img
          src={`data:image/jpeg;base64,${img.content}`}
          alt=""
          loading="lazy"
        />
      </div>
    ));
  };

  return (
    <div className={styles.overlay}>
      <div
        className={styles.content}
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {renderImages()}

        {/* 버튼 컨트롤 */}
        <div className={styles.controlsOverlay}>
          <button
            className={styles.controlButton}
            onClick={handlePrev}
          >
            ‹
          </button>
          <button className={styles.controlButton} onClick={onClose}>
            ✕
          </button>
          <button
            className={styles.controlButton}
            onClick={handleNext}
          >
            ›
          </button>
        </div>

        {/* 썸네일 바 */}
        <div
          className={styles.thumbnailBar}
          ref={thumbRef}
          onClick={(e) => e.stopPropagation()}
        >
          {renderThumbnails()}
        </div>
      </div>
    </div>
  );
}
