'use client';

import React from "react";
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
    isUploading,
    isSelecting, // Add this
  } = usePhotoUpload();

  const handleResetHover = () => setHoveredIndex(null);

  return (
    <div className={styles.page} onClick={handleResetHover}>
      <div className={styles.container}>
        <div className={styles.header}>저희에게 사진을 공유해주세요</div>
      </div>
      <div className={styles.galleryContainer}>
        <Gallery
          selectedFiles={selectedFiles}
          duplicateFiles={duplicateFiles}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
          handleRemovePhoto={handleRemovePhoto}
          handleFileChange={handleFileChange}
          isSelecting={isSelecting} // Pass down
        />
      </div>
      {duplicateFiles.length > 0 && (
        <div className="little">
          중복된 사진은 서버로 전송되지 않습니다. 중복된 사진: {duplicateFiles.length}개
        </div>
      )}
      {selectedFiles.length > 0 && (
        <UploadButton handleUpload={handleUpload} isUploading={isUploading} />
      )}
    </div>
  );
}
