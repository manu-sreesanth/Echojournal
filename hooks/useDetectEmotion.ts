import { useState } from 'react';
import debounce from 'lodash.debounce';

export default function useDetectEmotion(onNegativeDetected: () => void) {
  const [popupShown, setPopupShown] = useState(false);

  const detectEmotion = debounce(async (text: string) => {
    if (!text || text.length < 10 || popupShown) return;

    try {
      const res = await fetch('/api/detectEmotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const { label } = await res.json();

      if (label === 'negative') {
        setPopupShown(true);
        onNegativeDetected();
      }
    } catch (error) {
      console.error('Error detecting emotion:', error);
    }
  }, 1000);

  return detectEmotion;
}
