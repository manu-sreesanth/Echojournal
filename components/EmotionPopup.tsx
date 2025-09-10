'use client';

import { useEffect } from 'react';
import styles from './EmotionPopup.module.css';

type EmotionPopupProps = {
  onYes: () => void;
  onNo: () => void;
  onTimeout: () => void;
};

const EmotionPopup = ({ onYes, onNo, onTimeout }: EmotionPopupProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onTimeout();
    }, 15000); // Auto-close after 15 sec

    return () => clearTimeout(timer);
  }, [onTimeout]);

  return (
    <div className={styles.popupWrapper}>
      <div className={styles.popup}>
        <p>😔 Sorry to hear that. Want to talk about it?</p>
        <div className={styles.buttonRow}>
          <button className={styles.btn} onClick={onYes}>Yes</button>
          <button className={styles.btn} onClick={onNo}>No</button>
        </div>
      </div>
    </div>
  );
};

export default EmotionPopup;
