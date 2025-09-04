'use client';

import React, { useRef } from "react";
import styles from "../page.module.css";

export default function FileInput({ handleFileChange, isSelecting }) {
  const fileInputRef = useRef(null);

  const onChange = (event) => {
    handleFileChange(event);
  };

  return (
    <>
      {isSelecting && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}
      <div className={styles.addButtonContainer}>
        <label htmlFor="fileInput" className={styles.addButton}>
          +
        </label>
        <input
          id="fileInput"
          type="file"
          multiple
          accept="image/*,image/heic"
          onChange={onChange}
          className={styles.hiddenInput}
          ref={fileInputRef}
        />
      </div>
    </>
  );
}
