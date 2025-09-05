'use client';

import React from "react";
import styles from "../page.module.css";

export default function UploadButton({ handleUpload }) {
  return (
    <button
      onClick={handleUpload}
      className={styles.submit}
    >
      전송하기
    </button>
  );
}
