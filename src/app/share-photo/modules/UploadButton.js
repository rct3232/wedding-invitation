'use client';

import React from "react";

export default function UploadButton({ handleUpload, isUploading }) {
  return (
    <>
      {isUploading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}
      <button
        onClick={handleUpload}
        className={styles.submit}
        disabled={isUploading}
      >
        전송하기
      </button>
    </>
  );
}
