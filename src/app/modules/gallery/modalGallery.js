import React from 'react';
import styles from './gallery.module.css';

const ModalGallery = ({ thumbImages, onImageClick, onClose, exit }) => (
  <div className={`${styles.modal} ${exit ? styles.modalExit : ''}`}>
    <button className={styles.closeModal} onClick={onClose}>
      ✖
    </button>
    <div className={styles.modalGallery}>
      {thumbImages.map((img, i) => (
        <div
          key={i}
          className={styles.modalPhoto}
          onClick={() => onImageClick(i)}
        >
          <img 
            src={`data:image/jpeg;base64,${img.content}`} 
            alt={`Image ${i + 1}`} 
            loading="lazy" 
          />
        </div>
      ))}
    </div>
  </div>
);

export default ModalGallery;
