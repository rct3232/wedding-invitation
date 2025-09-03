'use client';

import React from "react";

export default function UploadButton({ handleUpload }) {
  return (
    <button onClick={handleUpload} className="content">
      전송하기
    </button>
  );
}
