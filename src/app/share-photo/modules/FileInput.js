'use client';

import styles from "../page.module.css";

export default function FileInput({ handleFileChange, isSelecting, uploadStarted = false }) {
  const disabled = uploadStarted;

  return (
    <>
      {isSelecting && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}
      <div className={`${styles.addButtonContainer} ${disabled ? styles.addDisabled : ''}`}>
        <label htmlFor="fileInput" className={styles.addButton}>
          <img src="/add-image.png" alt="+" style={{ width: '40%', height: 'auto' }} />
        </label>
        <input
          id="fileInput"
          type="file"
          multiple
          accept="image/*,image/heic"
          onChange={handleFileChange}
          className={styles.hiddenInput}
          disabled={disabled}
        />
      </div>
    </>
  );
}
