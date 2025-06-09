import React from "react";
import styles from "./gallery.module.css";

const GalleryGrid = ({ images, onImageClick }) => {
  return (
    <div className={styles.gallery}>
      {images.map((src, i) => (
        <div key={i} className={styles.galleryPhoto} onClick={() => onImageClick(i)}>
          <img src={src} alt={`Image ${i+1}`} loading="lazy" />
        </div>
      ))}
    </div>
  );
};

export default GalleryGrid;
