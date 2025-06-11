import React from 'react';
import styles from './gallery.module.css';

const GalleryGrid = ({ thumbImages, onImageClick }) => (
  <div className={styles.gallery}>
    {thumbImages.map((img, i) => (
      <div
        key={i}
        className={styles.galleryPhoto}
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
);

export default GalleryGrid;
