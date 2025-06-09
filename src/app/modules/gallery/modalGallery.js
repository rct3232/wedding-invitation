import React from "react";
import styles from "./gallery.module.css";

const ModalGallery = ({ images, onImageClick, onClose }) => {
  return (
    <div className={styles.modal}>
      <button className={styles.closeModal} onClick={onClose}>✖</button>
      <div className={styles.modalGallery}>
        {images.map((src, i) => (
          <div key={i} className={styles.modalPhoto} onClick={() => onImageClick(i)}>
            <img src={src} alt={`Image ${i+1}`} loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModalGallery;
