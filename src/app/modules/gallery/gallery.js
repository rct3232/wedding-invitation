'use client';

import { useState } from "react";
import GalleryGrid from "./galleryGrid";
import ModalGallery from "./modalGallery";
import EnlargedOverlay from "./enlargedOverlay";
import styles from "./gallery.module.css";

const Gallery = () => {
  // 전체 이미지 배열 (실제 이미지 경로로 변경)
  const images = [
    "KakaoTalk_20250603_185759437.jpg",
    "KakaoTalk_20250603_185759437_01.jpg",
    "KakaoTalk_20250603_185759437_02.jpg",
    "KakaoTalk_20250603_185759437_03.jpg",
    "KakaoTalk_20250603_185759437_04.jpg",
    "KakaoTalk_20250603_185759437_05.jpg",
    "KakaoTalk_20250603_185759437_06.jpg",
    "KakaoTalk_20250603_185759437_07.jpg",
    "KakaoTalk_20250603_185759437_08.jpg",
    "KakaoTalk_20250603_185759437_09.jpg",
    "KakaoTalk_20250603_185759437_01.jpg",
    "KakaoTalk_20250603_185759437_02.jpg",
    "KakaoTalk_20250603_185759437_03.jpg",
    "KakaoTalk_20250603_185759437_04.jpg",
    "KakaoTalk_20250603_185759437_05.jpg",
    "KakaoTalk_20250603_185759437_06.jpg",
    "KakaoTalk_20250603_185759437_07.jpg",
    "KakaoTalk_20250603_185759437_08.jpg",
    "KakaoTalk_20250603_185759437_09.jpg"
  ];
  // 메인 갤러리에서는 처음 9장만 보여줌
  const mainImages = images.slice(0, 9);

  // overlayData: 오버레이가 열렸을 때, full images 배열에서 몇 번째 이미지를 보여줄지 결정
  const [overlayData, setOverlayData] = useState({
    isOpen: false,
    index: null,
  });
  const [showModal, setShowModal] = useState(false);

  // mainGrid나 모달 갤러리에서 이미지 클릭 시—전역 이미지 배열(full images)에서 해당 이미지의 인덱스(0～8는 메인에서 그대로, 나머지는 모달에서)를 사용
  const openOverlay = (i) => {
    setOverlayData({ isOpen: true, index: i });
  };
  const closeOverlay = () => setOverlayData({ isOpen: false, index: null });

  const handleNext = () => {
    if (overlayData.index < images.length - 1)
      setOverlayData({ ...overlayData, index: overlayData.index + 1 });
  };
  const handlePrev = () => {
    if (overlayData.index > 0)
      setOverlayData({ ...overlayData, index: overlayData.index - 1 });
  };

  return (
    <div className={styles.container}>
      {/* 메인 갤러리 — 처음 9장만 표시 */}
      <GalleryGrid images={mainImages} onImageClick={(i) => openOverlay(i)} />
      <a className={styles.body} href="/" onClick={(e) => {
        e.preventDefault();
        setShowModal(true);
      }}>
        더보기
      </a>
      {/* 전체 이미지 모달 갤러리 */}
      {showModal && (
        <ModalGallery
          images={images}
          onImageClick={(i) => openOverlay(i)}
          onClose={() => setShowModal(false)}
        />
      )}
      {/* 확대 오버레이 (항상 전역 images 배열 사용) */}
      {overlayData.isOpen && (
        <EnlargedOverlay
          images={images}
          index={overlayData.index}
          onClose={closeOverlay}
          onNext={handleNext}
          onPrev={handlePrev}
          onSelect={(i) => setOverlayData({ ...overlayData, index: i })}
        />
      )}
    </div>
  );
};

export default Gallery;
