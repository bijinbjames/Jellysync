import type { RefObject } from 'react';

interface HtmlVideoPlayerProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  streamUrl: string;
}

export function HtmlVideoPlayer({ videoRef, streamUrl }: HtmlVideoPlayerProps) {
  return (
    <div style={containerStyle}>
      <video
        ref={videoRef}
        style={videoStyle}
        playsInline
      />
      <div style={topGradientStyle} />
      <div style={bottomGradientStyle} />
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100vw',
  height: '100vh',
  backgroundColor: '#0e0e0e',
  overflow: 'hidden',
};

const videoStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  objectFit: 'contain',
};

const topGradientStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '15%',
  background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
  pointerEvents: 'none',
};

const bottomGradientStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '15%',
  background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
  pointerEvents: 'none',
};
