'use client';

import { memo } from "react";
import FileInput from "./FileInput";
import styles from "../page.module.css";

const GalleryItem = memo(function GalleryItem({
  file,
  index,
  isDuplicate,
  hoveredIndex,
  setHoveredIndex,
  handleRemovePhoto,
  progress = null,
  uploadStarted = false,
}) {
  // Detect if the original file was a video by its filename extension
  const isVideo = /\.(mp4|mov|mkv|avi|webm|m4v|3gp|3g2|hevc)$/i.test(file?.name || '');

  const showProgress =
    uploadStarted &&
    !isDuplicate &&
    typeof progress === 'number' &&
    progress >= 0 &&
    progress <= 100;

  const overlayClass = `${styles.progressOverlay} ${progress === 100 ? styles.progressComplete : ''}`;

  return (
    <div
      className={`${styles.detail} ${
        hoveredIndex === index ? styles.hovered : ""
      } ${isDuplicate ? styles.duplicate : ""}`}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      onClick={(e) => e.stopPropagation()}
      style={{ position: 'relative' }}
    >
      <img
        src={URL.createObjectURL(file)}
        alt={`Thumbnail ${index + 1}`}
        className={isDuplicate ? styles.darkened : ""}
      />
      {isVideo && (
        <img
          src="/circle-video.png"
          alt="video"
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            width: 24,
            height: 24,
            zIndex: 3,
            pointerEvents: 'none',
            opacity: 0.9,
            filter: 'drop-shadow(0 0 2px var(--background)) drop-shadow(0 0 4px var(--background))',
          }}
        />
      )}
      {showProgress && (
        <div className={overlayClass} style={{ ['--progress']: `${progress}%` }}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} />
          </div>
        </div>
      )}
      {hoveredIndex === index && (
        <button
          className={styles.removeButton}
          onClick={() => handleRemovePhoto(index, isDuplicate)}
        >
          X
        </button>
      )}
    </div>
  );
});

export default function Gallery({
  selectedFiles,
  duplicateFiles,
  hoveredIndex,
  setHoveredIndex,
  handleRemovePhoto,
  handleFileChange,
  isSelecting,
  uploadProgress = [],
  uploadStarted = false,
}) {
  return (
    <div className={styles.gallery}>
      <FileInput
        handleFileChange={handleFileChange}
        isSelecting={isSelecting}
        uploadStarted={uploadStarted}
      />
      {[...selectedFiles, ...duplicateFiles].map((file, index) => {
        const isDuplicate = index >= selectedFiles.length;
        const progress = isDuplicate ? null : (uploadProgress[index] ?? 0);
        return (
          <GalleryItem
            key={index}
            file={file}
            index={index}
            isDuplicate={isDuplicate}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
            handleRemovePhoto={handleRemovePhoto}
            progress={progress}
            uploadStarted={uploadStarted}
          />
        );
      })}
    </div>
  );
}
