'use client';

import React, { memo } from "react";
import FileInput from "./FileInput";
import styles from "../page.module.css";

const GalleryItem = memo(function GalleryItem({
  file,
  index,
  isDuplicate,
  hoveredIndex,
  setHoveredIndex,
  handleRemovePhoto,
}) {
  return (
    <div
      className={`${styles.detail} ${
        hoveredIndex === index ? styles.hovered : ""
      } ${isDuplicate ? styles.duplicate : ""}`}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      onClick={(e) => e.stopPropagation()}
    >
      <img
        src={URL.createObjectURL(file)}
        alt={`Thumbnail ${index + 1}`}
        className={isDuplicate ? styles.darkened : ""}
      />
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
}) {
  return (
    <div className={styles.gallery}>
      <FileInput handleFileChange={handleFileChange} isSelecting={isSelecting} />
      {[...selectedFiles, ...duplicateFiles].map((file, index) => {
        const isDuplicate = index >= selectedFiles.length;
        return (
          <GalleryItem
            key={index}
            file={file}
            index={index}
            isDuplicate={isDuplicate}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
            handleRemovePhoto={handleRemovePhoto}
          />
        );
      })}
    </div>
  );
}
