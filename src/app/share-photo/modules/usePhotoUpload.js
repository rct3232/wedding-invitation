'use client';

import { useState, useEffect } from "react";

export default function usePhotoUpload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [duplicateFiles, setDuplicateFiles] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [existingHashes, setExistingHashes] = useState(new Set());
  const CHUNK_SIZE = 3;

  const fetchHashes = async (pathParam) => {
    try {
      const response = await fetch(`/api/photo-hashes/${encodeURIComponent(pathParam)}`);
      if (response.ok) {
        const data = await response.json();
        setExistingHashes(new Set(data.hashes));
      } else {
        console.error("Failed to fetch existing hashes.");
      }
    } catch (error) {
      console.error("Error fetching hashes:", error);
    }
  };

  const calculateFileHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const handleFileChange = async (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathParam = urlParams.get("path");

    if (!pathParam) {
      alert("Path parameter is missing.");
      return;
    }

    const files = Array.from(event.target.files);
    const newDuplicateFiles = [];
    const newFiles = [];

    await fetchHashes(pathParam);

    for (const file of files) {
      const fileHash = await calculateFileHash(file);
      if (existingHashes.has(fileHash)) {
        newDuplicateFiles.push(file);
      } else {
        newFiles.push(file);
      }
    }

    setDuplicateFiles((prev) => [...prev, ...newDuplicateFiles]);
    setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleRemovePhoto = (index, isDuplicate) => {
    if (isDuplicate) {
      setDuplicateFiles((prev) => prev.filter((_, i) => i !== index));
    } else {
      setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    }
    setHoveredIndex(null);
  };

  const uploadChunk = async (chunk, pathParam) => {
    const formData = new FormData();
    chunk.forEach((file) => {
      formData.append("photos", file);
    });

    const response = await fetch(`/api/photo-upload/${encodeURIComponent(pathParam)}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload chunk");
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
    for (let i = 0; i < selectedFiles.length; i += CHUNK_SIZE) {
      chunks.push(selectedFiles.slice(i, i + CHUNK_SIZE));
    }

    try {
      for (const chunk of chunks) {
        await uploadChunk(chunk, pathParam);
      }
      alert("Photos uploaded successfully!");
      window.location.reload();
    } catch (error) {
      alert("An error occurred while uploading photos.");
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
  };
}
