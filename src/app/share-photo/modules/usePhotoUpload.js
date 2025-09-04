'use client';

import { useState, useEffect, useCallback } from "react";
import CryptoJS from "crypto-js";

export default function usePhotoUpload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [duplicateFiles, setDuplicateFiles] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [existingHashes, setExistingHashes] = useState(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [originalFiles, setOriginalFiles] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [clientHashes, setClientHashes] = useState(new Set());
  const [selectedHashes, setSelectedHashes] = useState([]);
  const [duplicateHashes, setDuplicateHashes] = useState([]);

  const CHUNK_SIZE = 3;

  const fetchHashes = async (pathParam) => {
    try {
      const response = await fetch(`/api/photo-hashes/${encodeURIComponent(pathParam)}`);
      if (response.ok) {
        const data = await response.json();
        const serverSet = new Set(data.hashes);
        setExistingHashes(serverSet);
        return serverSet;
      } else {
        console.error("Failed to fetch existing hashes.");
      }
    } catch (error) {
      console.error("Error fetching hashes:", error);
    }
    return new Set();
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

        const files = Array.from(event.target.files);
        const newDuplicateFiles = [];
        const newFiles = [];
        const newOriginalFiles = [];
        const newSelectedHashes = [];
        const newDuplicateHashes = [];

        const serverHashes = await fetchHashes(pathParam);

        const accumulated = new Set(clientHashes);

        for (const file of files) {
          const fileHash = await calculateFileHash(file);

          if (accumulated.has(fileHash)) {
            continue;
          }

          if (serverHashes.has(fileHash)) {
            const thumbnailBlob = await generateThumbnail(file);
            const thumbnailFile = new File([thumbnailBlob], file.name, { type: "image/jpeg" });
            newDuplicateFiles.push(thumbnailFile);
            newDuplicateHashes.push(fileHash);
          } else {
            const thumbnailBlob = await generateThumbnail(file);
            const thumbnailFile = new File([thumbnailBlob], file.name, { type: "image/jpeg" });
            newFiles.push(thumbnailFile);
            newOriginalFiles.push(file);
            newSelectedHashes.push(fileHash);
          }

          accumulated.add(fileHash);
        }

        setDuplicateFiles((prev) => [...prev, ...newDuplicateFiles]);
        setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
        setOriginalFiles((prevFiles) => [...prevFiles, ...newOriginalFiles]);
        setDuplicateHashes((prev) => [...prev, ...newDuplicateHashes]);
        setSelectedHashes((prev) => [...prev, ...newSelectedHashes]);
        setClientHashes(accumulated);
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
      setClientHashes((prev) => {
        const next = new Set(prev);
        if (hashToRemove) next.delete(hashToRemove);
        return next;
      });
    }
    setHoveredIndex(null);
  };

  const uploadChunk = async (chunk, pathParam, hashes) => {
    const formData = new FormData();
    chunk.forEach((file, index) => {
      formData.append("photos", file);
      formData.append("hashes", hashes[index]);
    });

    const response = await fetch(`/api/photo-upload/${encodeURIComponent(pathParam)}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("업로드에 실패했습니다.");
    }
  };

  const handleUpload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathParam = urlParams.get("path");

    if (!pathParam) {
      alert("Path parameter is missing.");
      return;
    }

    const chunks = [];
    const hashes = [];
    for (let i = 0; i < originalFiles.length; i += CHUNK_SIZE) {
      chunks.push(originalFiles.slice(i, i + CHUNK_SIZE));
      hashes.push(originalFiles.slice(i, i + CHUNK_SIZE).map(file => calculateFileHash(file)));
    }

    setIsUploading(true);
    try {
      for (let i = 0; i < chunks.length; i++) {
        await uploadChunk(chunks[i], pathParam, await Promise.all(hashes[i]));
      }
      alert("업로드되었습니다.");
      window.location.reload();
    } catch (error) {
      alert("업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathParam = urlParams.get("path");

    if (!pathParam) {
      alert("Path parameter is missing.");
      return;
    }

    fetchHashes(pathParam);
  }, []);

  return {
    selectedFiles,
    duplicateFiles,
    handleFileChange,
    handleRemovePhoto,
    handleUpload,
    hoveredIndex,
    setHoveredIndex,
    isUploading,
    isSelecting,
  };
}
