// Small text component that fades itself out after a delay.
import React, { useEffect, useState } from 'react';

interface FadeOutTextProps {
  text: string;
  delay?: number; // how long before text clears
  className?: string;
  style?: React.CSSProperties;
}

const FadeOutText: React.FC<FadeOutTextProps> = ({
  text,
  delay = 5000,
  className = '',
  style = {},
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!text) return;
    
    // immediately show new text
    setDisplayText(text);
    setIsVisible(true);
    
    // start fade-out timer (fade starts 500ms before clearing)
    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
    }, delay - 500);

    // clear text after fade completes
    const clearTimer = setTimeout(() => {
      setDisplayText('');
    }, delay);
    
    // cleanup on next text change or unmount
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
  }, [text, delay]);

  return (
    <p 
      className={className} 
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-out'
      }}
    >
      {displayText}
    </p>
  );
};

export default FadeOutText;
