'use client';

import React, { useRef } from "react";
import styles from "../page.module.css";

export default function FileInput({ handleFileChange }) {
  const fileInputRef = useRef(null);

  return (
    <div className={styles.addButtonContainer}>
      <label htmlFor="fileInput" className={styles.addButton}>
        +
      </label>
      <input
        id="fileInput"
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className={styles.hiddenInput}
        ref={fileInputRef}
      />
    </div>
  );
}
