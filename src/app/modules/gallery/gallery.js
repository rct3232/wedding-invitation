'use client';
import React, { useState } from 'react';
import GalleryGrid from './galleryGrid';
import ModalGallery from './modalGallery';
import EnlargedOverlay from './enlargedOverlay';
import styles from './gallery.module.css';

const Gallery = ({
  fullImages,
  thumbImages
}) => {

  // 메인 그리드에서는 썸네일 배열의 앞 9개만 보여줍니다.
  const mainThumbs = thumbImages.slice(0, 9);

  // overlay 관련 상태: overlay가 열리면 어떤 이미지(인덱스)를 보여줄지 결정
  const [overlayData, setOverlayData] = useState({
    isOpen: false,
    index: null
  });
  // 모달 갤러리 상태
  const [showModal, setShowModal] = useState(false);
  // 모달 종료 애니메이션 적용을 위한 상태
  const [modalExiting, setModalExiting] = useState(false);

  const openOverlay = (i) => {
    setOverlayData({ isOpen: true, index: i });
  };
  const closeOverlay = () => setOverlayData({ isOpen: false, index: null });
  const handleNext = () => {
    if (overlayData.index < fullImages.length - 1)
      setOverlayData({ ...overlayData, index: overlayData.index + 1 });
  };
  const handlePrev = () => {
    if (overlayData.index > 0)
      setOverlayData({ ...overlayData, index: overlayData.index - 1 });
  };

  // 모달 종료 애니메이션을 적용한 후 0.5초 뒤 모달을 완전히 닫도록 함
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
      <a
        className={styles.more}
        href="/"
        onClick={(e) => {
          e.preventDefault();
          setShowModal(true);
        }}
      >
        더보기
      </a>
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
