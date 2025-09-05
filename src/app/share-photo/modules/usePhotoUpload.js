'use client';

import { useState, useCallback } from "react";
import CryptoJS from "crypto-js";

export default function usePhotoUpload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [duplicateFiles, setDuplicateFiles] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [originalFiles, setOriginalFiles] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [clientHashes, setClientHashes] = useState(new Set());
  const [selectedHashes, setSelectedHashes] = useState([]);
  const [duplicateHashes, setDuplicateHashes] = useState([]);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [uploadStarted, setUploadStarted] = useState(false);
  const [uploadStatus, setUploadStatus] = useState([]);

  const CHUNK_BYTE_SIZE = 512 * 1024;

  const getRecommendedConcurrency = () => {
    const c = typeof navigator !== 'undefined'
      ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection)
      : null;

    if (!c) return 2;

    if (c.saveData) return 1;
    const type = (c.effectiveType || '').toLowerCase();
    const down = Number(c.downlink || 0);
    const rtt = Number(c.rtt || 0);

    if (type.includes('2g')) return 1;
    if (type === '3g') return 1;
    if (down < 1.5 || rtt > 300) return 1;
    if (down < 5 || rtt > 150) return 2;
    return 3;
  };

  const calculateFileHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const normalizedBuffer = await normalizeFile(arrayBuffer);
    const wordArray = CryptoJS.lib.WordArray.create(normalizedBuffer);
    return CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
  };

  const normalizeFile = async (arrayBuffer) => {
    return new Promise((resolve) => {
      const blob = new Blob([arrayBuffer]);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((normalizedBlob) => {
            const normalizedReader = new FileReader();
            normalizedReader.onload = () => resolve(normalizedReader.result);
            normalizedReader.readAsArrayBuffer(normalizedBlob);
          }, "image/jpeg", 0.7);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(blob);
    });
  };

  const generateThumbnail = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const MAX_SIZE = 200;
          const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.7);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const checkServerDuplicates = async (pathParam, hashes) => {
    try {
      const res = await fetch(`/api/photo-hash-check/${encodeURIComponent(pathParam)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hashes }),
      });
      if (res.ok) {
        const data = await res.json();
        return new Set(data.duplicates || []);
      }
    } catch (e) {
      console.error("Error checking duplicates:", e);
    }
    return new Set();
  };

  const handleFileChange = useCallback(
    async (event) => {
      setIsSelecting(true);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const pathParam = urlParams.get("path");
        if (!pathParam) {
          alert("Path parameter is missing.");
          return;
        }

        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        const hashedList = await Promise.all(
          files.map(async (file) => ({ file, hash: await calculateFileHash(file) }))
        );

        const accumulated = new Set(clientHashes);
        const pending = hashedList.filter(({ hash }) => !accumulated.has(hash));

        if (pending.length === 0) {
          return;
        }

        const serverDupSet = await checkServerDuplicates(
          pathParam,
          pending.map((p) => p.hash)
        );

        const newDuplicateFiles = [];
        const newDuplicateHashes = [];
        const newFiles = [];
        const newOriginalFiles = [];
        const newSelectedHashes = [];
        const newProgress = [];
        const newStatus = [];

        for (const { file, hash } of pending) {
          const thumbnailBlob = await generateThumbnail(file);
          const thumbnailFile = new File([thumbnailBlob], file.name, { type: "image/jpeg" });

          if (serverDupSet.has(hash)) {
            newDuplicateFiles.push(thumbnailFile);
            newDuplicateHashes.push(hash);
          } else {
            newFiles.push(thumbnailFile);
            newOriginalFiles.push(file);
            newSelectedHashes.push(hash);
            newProgress.push(0);
            newStatus.push('idle');
          }

          accumulated.add(hash);
        }

        setDuplicateFiles((prev) => [...prev, ...newDuplicateFiles]);
        setDuplicateHashes((prev) => [...prev, ...newDuplicateHashes]);
        setSelectedFiles((prev) => [...prev, ...newFiles]);
        setOriginalFiles((prev) => [...prev, ...newOriginalFiles]);
        setSelectedHashes((prev) => [...prev, ...newSelectedHashes]);
        setClientHashes(accumulated);
        setUploadProgress((prev) => [...prev, ...newProgress]);
        setUploadStatus((prev) => [...prev, ...newStatus]);
      } finally {
        setIsSelecting(false);
      }
    },
    [clientHashes]
  );

  const handleRemovePhoto = (index, isDuplicate) => {
    if (isDuplicate) {
      const dupIndex = index - selectedFiles.length;
      if (dupIndex < 0) return;

      const hashToRemove = duplicateHashes[dupIndex];
      setDuplicateFiles((prev) => prev.filter((_, i) => i !== dupIndex));
      setDuplicateHashes((prev) => prev.filter((_, i) => i !== dupIndex));
      setClientHashes((prev) => {
        const next = new Set(prev);
        if (hashToRemove) next.delete(hashToRemove);
        return next;
      });
    } else {
      const hashToRemove = selectedHashes[index];
      setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
      setOriginalFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
      setSelectedHashes((prev) => prev.filter((_, i) => i !== index));
      setUploadProgress((prev) => prev.filter((_, i) => i !== index));
      setUploadStatus((prev) => prev.filter((_, i) => i !== index));
      setClientHashes((prev) => {
        const next = new Set(prev);
        if (hashToRemove) next.delete(hashToRemove);
        return next;
      });
    }
    setHoveredIndex(null);
  };

  const uploadFileInChunks = async (file, fileHash, pathParam, fileIndex) => {
    setUploadProgress((prev) => {
      const next = [...prev];
      next[fileIndex] = 0;
      return next;
    });
    setUploadStatus((prev) => {
      const next = [...prev];
      next[fileIndex] = 'uploading';
      return next;
    });

    const totalChunks = Math.ceil(file.size / CHUNK_BYTE_SIZE);
    for (let idx = 0; idx < totalChunks; idx++) {
      const start = idx * CHUNK_BYTE_SIZE;
      const end = Math.min(start + CHUNK_BYTE_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("chunk", chunk, file.name);
      formData.append("fileId", fileHash);
      formData.append("chunkIndex", String(idx));
      formData.append("totalChunks", String(totalChunks));
      formData.append("originalName", file.name);
      formData.append("hash", fileHash);

      const response = await fetch(`/api/photo-upload-chunk/${encodeURIComponent(pathParam)}`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("업로드에 실패했습니다.");

      const percent = Math.round(((idx + 1) / totalChunks) * 100);
      setUploadProgress((prev) => {
        const next = [...prev];
        next[fileIndex] = percent;
        return next;
      });
    }

    setUploadStatus((prev) => {
      const next = [...prev];
      next[fileIndex] = 'done';
      return next;
    });
    setUploadProgress((prev) => {
      const next = [...prev];
      next[fileIndex] = 100;
      return next;
    });
  };

  const handleUpload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathParam = urlParams.get("path");
    if (!pathParam) {
      alert("Path parameter is missing.");
      return;
    }

    if (originalFiles.length === 0) {
      alert("업로드할 사진이 없습니다.");
      return;
    }

    const pendingIndices = selectedFiles
      .map((_, i) => i)
      .filter((i) => uploadStatus[i] !== 'done');

    if (pendingIndices.length === 0) {
      alert("이미 업로드가 완료되었습니다.");
      return;
    }

    try {
      setClientHashes((prev) => {
        const next = new Set(prev);
        duplicateHashes.forEach((h) => { if (h) next.delete(h); });
        return next;
      });
      setDuplicateFiles([]);
      setDuplicateHashes([]);
      setHoveredIndex(null);

      setUploadStarted(true);

      const concurrency = Math.max(1, Math.min(getRecommendedConcurrency(), pendingIndices.length));
      let cursor = 0;

      const completed = new Set();
      const failed = new Set();

      const worker = async () => {
        while (cursor < pendingIndices.length) {
          const i = pendingIndices[cursor++];
          try {
            await uploadFileInChunks(originalFiles[i], selectedHashes[i], pathParam, i);
            completed.add(i);
          } catch {
            failed.add(i);
            setUploadStatus((prev) => {
              const next = [...prev];
              next[i] = 'failed';
              return next;
            });
          }
        }
      };

      await Promise.all(Array.from({ length: concurrency }, () => worker()));

      if (completed.size > 0) {
        const keep = (arr) => arr.filter((_, idx) => !completed.has(idx));
        const hashesToRemove = selectedHashes.filter((_, idx) => completed.has(idx));

        setSelectedFiles((prev) => keep(prev));
        setOriginalFiles((prev) => keep(prev));
        setSelectedHashes((prev) => keep(prev));
        setUploadProgress((prev) => keep(prev));
        setUploadStatus((prev) => keep(prev));
        setClientHashes((prev) => {
          const next = new Set(prev);
          hashesToRemove.forEach((h) => { if (h) next.delete(h); });
          return next;
        });
      }

      if (failed.size > 0) {
        alert("일부 사진 업로드에 실패했습니다. 다시 시도해주세요.");
      } else {
        alert("업로드되었습니다.");
      }
    } finally {
      setUploadStarted(false);
    }
  };

  const overallProgress =
    uploadProgress.length > 0
      ? Math.round(uploadProgress.reduce((a, b) => a + (b || 0), 0) / uploadProgress.length)
      : 0;

  return {
    selectedFiles,
    duplicateFiles,
    handleFileChange,
    handleRemovePhoto,
    handleUpload,
    hoveredIndex,
    setHoveredIndex,
    isSelecting,
    uploadProgress,
    uploadStarted,
    overallProgress,
  };
}
