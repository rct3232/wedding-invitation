import React from 'react';
import styles from './gallery.module.css';

const GalleryGrid = ({ thumbImages, onImageClick }) => (
  <div className={styles.gallery}>
    {thumbImages.map((src, i) => (
      <div
        key={i}
        className={styles.galleryPhoto}
        onClick={() => onImageClick(i)}
      >
        <img src={src} alt={`Image ${i + 1}`} loading="lazy" />
      </div>
    ))}
  </div>
);

export default GalleryGrid;
