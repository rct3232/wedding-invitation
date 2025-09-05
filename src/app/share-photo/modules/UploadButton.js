'use client';

import styles from "../page.module.css";

export default function UploadButton({ handleUpload, uploadStarted, overallProgress = 0 }) {
  if (uploadStarted) {
    return (
      <div className={styles.globalProgressWrap} aria-label="전체 업로드 진행률">
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ ['--progress']: `${overallProgress}%` }}
          />
        </div>
        <div className={styles.globalProgressLabel}>{overallProgress}%</div>
      </div>
    );
  }

  return (
    <button
      onClick={handleUpload}
      className={styles.submit}
    >
      전송하기
    </button>
  );
}
