'use client';
import React, { useState } from 'react';
import Link from 'next/link';

import GalleryGrid from './galleryGrid';
import ModalGallery from './modalGallery';
import EnlargedOverlay from './enlargedOverlay';
import styles from './gallery.module.css';

const Gallery = ({ fullImages, thumbImages, query }) => {
  // 메인 그리드는 항상 9개의 셀을 렌더링합니다.
  // 사진이 부족한 경우 placeholder(null)로 채워줍니다.
  let mainThumbs = thumbImages.slice(0, 9);
  if (mainThumbs.length < 9) {
    const placeholders = Array(9 - mainThumbs.length).fill(null);
    mainThumbs = mainThumbs.concat(placeholders);
  }

  // overlay 관련 상태: overlay가 열리면 어떤 이미지(인덱스)를 보여줄지 결정
  const [overlayData, setOverlayData] = useState({
    isOpen: false,
    index: null
  });
  const [showModal, setShowModal] = useState(false);
  const [modalExiting, setModalExiting] = useState(false);

  const openOverlay = (i) => {
    // 만약 해당 셀이 placeholder라면 아무 작업도 하지 않음
    if (!mainThumbs[i]) return;
    setOverlayData({ isOpen: true, index: i });
  };
  const closeOverlay = () => setOverlayData({ isOpen: false, index: null });
  const handleNext = () => {
    if (overlayData.index < fullImages.length - 1) {
      setOverlayData({ ...overlayData, index: overlayData.index + 1 });
    }
  };
  const handlePrev = () => {
    if (overlayData.index > 0) {
      setOverlayData({ ...overlayData, index: overlayData.index - 1 });
    }
  };

  // 모달 종료 애니메이션을 적용한 후 0.5초 뒤 모달을 완전히 닫음
  const handleModalClose = () => {
    setModalExiting(true);
    setTimeout(() => {
      setShowModal(false);
      setModalExiting(false);
    }, 500);
  };

  return (
    <div className={styles.container}>
      <GalleryGrid thumbImages={mainThumbs} onImageClick={openOverlay} />
      {/* 사진이 9개 초과일 때에만 더보기 버튼 표시 */}
      {thumbImages.length > 9 && (
        <Link
          className={styles.more}
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setShowModal(true);
          }}
        >
          더보기
        </Link>
      )}
      {showModal && (
        <ModalGallery
          thumbImages={thumbImages}
          onImageClick={openOverlay}
          onClose={handleModalClose}
          exit={modalExiting}
        />
      )}
      {overlayData.isOpen && (
        <EnlargedOverlay
          fullImages={fullImages}
          thumbImages={thumbImages}
          index={overlayData.index}
          query={query}
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