import React from 'react'

export default function CameraView({ videoRef, isActive, error }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-white/5 aspect-video">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}
        style={{ transform: 'scaleX(-1)' }}
      />
      {!isActive && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/30">
          <div className="text-4xl">📷</div>
          <p className="text-sm">Camera preview will appear here</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <div className="text-3xl">🚫</div>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {isActive && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 rounded-full px-2.5 py-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-xs font-medium">LIVE</span>
        </div>
      )}
    </div>
  )
}
