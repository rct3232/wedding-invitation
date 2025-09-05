'use client';

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import Gallery from "./modules/Gallery";
import UploadButton from "./modules/UploadButton";
import usePhotoUpload from "./modules/usePhotoUpload";

export default function SharePhotoPage() {
  const {
    selectedFiles,
    duplicateFiles,
    handleFileChange,
    handleRemovePhoto,
    handleUpload,
    hoveredIndex,
    setHoveredIndex,
    isSelecting,
    uploadProgress,
    uploadStarted,
    overallProgress,
  } = usePhotoUpload();

  const handleResetHover = () => setHoveredIndex(null);

  const galleryRef = useRef(null);
  const rafLock = useRef(false);
  const [offTop, setOffTop] = useState(false);
  const [offBottom, setOffBottom] = useState(false);

  const recalcShadows = () => {
    const el = galleryRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const canScroll = scrollHeight - clientHeight > 1;
    const atTop = scrollTop <= 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
    setOffTop(canScroll && !atTop);
    setOffBottom(canScroll && !atBottom);
  };

  const onScroll = () => {
    if (rafLock.current) return;
    rafLock.current = true;
    window.requestAnimationFrame(() => {
      recalcShadows();
      rafLock.current = false;
    });
  };

  useEffect(() => {
    recalcShadows();
    const onResize = () => recalcShadows();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className={styles.page} onClick={handleResetHover}>
      <div className={styles.container}>
        <div className={styles.header}>저희에게 사진을 공유해주세요</div>
      </div>
      <div className={`${styles.galleryWrap} ${offTop ? styles.offTop : ''} ${offBottom ? styles.offBottom : ''}`}>
        <div className={`${styles.shadow} ${styles.shadowTop}`} aria-hidden="true" />
        <div className={`${styles.shadow} ${styles.shadowBottom}`} aria-hidden="true" />
        <div ref={galleryRef} onScroll={onScroll} className={styles.galleryContainer}>
          <Gallery
            selectedFiles={selectedFiles}
            duplicateFiles={duplicateFiles}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
            handleRemovePhoto={handleRemovePhoto}
            handleFileChange={handleFileChange}
            isSelecting={isSelecting}
            uploadProgress={uploadProgress}
            uploadStarted={uploadStarted}
          />
        </div>
      </div>
      {uploadStarted ? (
        <div className="little">페이지를 벗어나지 마세요!</div>
      ) : (
        duplicateFiles.length > 0 && (
          <div className="little">
            중복된 사진은 서버로 전송되지 않습니다. 중복된 사진: {duplicateFiles.length}개
          </div>
        )
      )}
      {selectedFiles.length > 0 && (
        <UploadButton
          handleUpload={handleUpload}
          uploadStarted={uploadStarted}
          overallProgress={overallProgress}
        />
      )}
    </div>
  );
}
