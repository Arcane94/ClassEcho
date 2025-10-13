import React, { useEffect, useState } from 'react';

interface FadeOutTextProps {
  text: string;
  delay?: number; // optional, defaults to 5 seconds
  duration?: number; // optional fade duration (ms)
  style?: React.CSSProperties;
  className: string;
}

const FadeOutText: React.FC<FadeOutTextProps> = ({
  text,
  delay = 5000,
  duration = 1000,
  style = {},
  className='',
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), delay);
    return () => clearTimeout(timer);
  }, [text, delay]);

  const fadeStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transition: `opacity ${duration}ms ease-in-out`,
    ...style,
  };

  return <p className={className} style={fadeStyle}>{text}</p>;
};

export default FadeOutText;