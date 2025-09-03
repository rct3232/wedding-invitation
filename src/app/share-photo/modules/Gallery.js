'use client';

import React from "react";
import FileInput from "./FileInput";
import styles from "../page.module.css";

export default function Gallery({
  selectedFiles,
  duplicateFiles,
  hoveredIndex,
  setHoveredIndex,
  handleRemovePhoto,
  handleFileChange,
}) {
  return (
    <div className={styles.gallery}>      
      <FileInput handleFileChange={handleFileChange} />
      {[...selectedFiles, ...duplicateFiles].map((file, index) => {
        const isDuplicate = duplicateFiles.includes(file);
        return (
          <div
            key={index}
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
      })}
    </div>
  );
}
