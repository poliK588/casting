import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function MediaHighlights() {
  const { mediaItems } = useAuth();
  const primaryPhoto = (mediaItems || []).find(
    m => m.is_primary && m.type === 'image'
  );
  const firstVideo = (mediaItems || []).find(
    m => m.type === 'video'
  );
  const otherPhotos = (mediaItems || []).filter(
    m => !m.is_primary && m.type === 'image'
  );

  let highlights = [];
  if (primaryPhoto) highlights.push(primaryPhoto);
  if (firstVideo) highlights.push(firstVideo);
  const remainingSlots = 4 - highlights.length;
  highlights = [...highlights, ...otherPhotos.slice(0, remainingSlots)];
  const allItems = mediaItems || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredPhotoId, setHoveredPhotoId] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  // Close on Escape
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (playingVideo) setPlayingVideo(null);
        else closeModal();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isModalOpen, playingVideo]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    setHoveredPhotoId(null);
  };

  const hoveredItem = hoveredPhotoId ? allItems.find(m => m.id === hoveredPhotoId) : null;

  return (
    <>
      {/* ── Dashboard Card ── */}
      <div className="glass-panel !rounded-[14px] p-[18px] lift">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path strokeLinecap="round" d="M3 9h18M9 21V9" /></svg>
            Media Highlights
          </span>
          {allItems.length > 0 ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-semibold cursor-pointer hover:underline flex items-center gap-1 bg-transparent border-0"
              style={{ color: 'var(--color-accent)' }}
            >
              Gallery →
            </button>
          ) : (
            <Link to="/talent/profile" className="text-xs font-semibold cursor-pointer hover:underline flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
              Gallery →
            </Link>
          )}
        </div>

        {highlights.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {highlights.map((item) => (
              <div
                key={item.id}
                onClick={() => setIsModalOpen(true)}
                className="aspect-square rounded-[10px] overflow-hidden relative cursor-pointer group bg-white/5"
              >
                {item.type === 'video' ? (
                  <>
                    <video src={item.url} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <svg width="14" height="14" viewBox="0 0 24 24" style={{ fill: 'var(--color-accent)' }}><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.6)' }}>
                      Video
                    </div>
                  </>
                ) : (
                  <>
                    <img src={item.url} alt="Media" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                  </>
                )}

                {item.is_primary && (
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow backdrop-blur-sm" style={{ background: 'rgba(245, 158, 11, 0.9)' }}>
                    <svg width="8" height="8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Primary
                  </div>
                )}
              </div>
            ))}

            {highlights.length < 4 && (
              <Link to="/talent/profile"
                className="aspect-square rounded-[10px] bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-white/25 transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--color-navy-500)' }}><path strokeLinecap="round" d="M12 4v16m8-8H4" /></svg>
                <span className="text-[9px] font-bold text-center" style={{ color: 'var(--color-navy-500)' }}>Add Media</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--color-navy-500)' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" /><path strokeLinecap="round" d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <p className="text-xs font-medium text-center" style={{ color: 'var(--color-navy-500)' }}>No media yet. Upload photos to showcase your portfolio.</p>
            <Link to="/talent/profile" className="text-xs font-bold hover:underline" style={{ color: 'var(--color-accent)' }}>
              Upload Media →
            </Link>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          Frameless Gallery Overlay — Single Layer
          ═══════════════════════════════════════════ */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] modal-backdrop flex flex-col p-6 md:p-10 overflow-hidden"
          style={{
            background: 'rgba(15, 23, 42, 0.25)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
          onClick={closeModal}
        >
          {/* ── Header row ── */}
          <div className="flex items-start justify-between mb-4 flex-shrink-0 fade-in" onClick={(e) => e.stopPropagation()}>
            <div>
              <h2 className="text-2xl font-bold tracking-tight fade-in" style={{ color: 'var(--color-navy-50)' }}>
                Portfolio Gallery
              </h2>
              <p className="text-xs mt-1 font-medium fade-in fade-in-d1" style={{ color: 'var(--color-navy-200)' }}>
                {allItems.length} item{allItems.length !== 1 ? 's' : ''} · Hover to preview
              </p>
            </div>
            <button
              onClick={closeModal}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer bg-white/5 hover:bg-white/10 flex-shrink-0"
            >
              <svg width="20" height="20" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" style={{ stroke: 'var(--color-navy-50)' }}>
                <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* ── Zero-scroll adaptive grid ── */}
          <div
            className="flex-1 min-h-0 fade-in fade-in-d1"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'grid',
              gap: '0.75rem',
              gridTemplateColumns: `repeat(${allItems.length <= 2 ? allItems.length : allItems.length <= 4 ? 2 : 3}, 1fr)`,
              gridTemplateRows: `repeat(${allItems.length <= 3 ? 1 : 2}, 1fr)`,
            }}
          >
            {allItems.map((item) => (
              <div
                key={item.id}
                className="relative rounded-xl cursor-pointer min-h-0 min-w-0"
                style={{
                  transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s cubic-bezier(0.4,0,0.2,1)',
                  transform: hoveredPhotoId === item.id ? 'scale(1.03)' : 'scale(1)',
                  boxShadow: hoveredPhotoId === item.id ? '0 25px 60px rgba(0,0,0,0.4)' : 'none',
                  zIndex: hoveredPhotoId === item.id ? 50 : 1,
                }}
                onMouseEnter={() => item.type === 'image' && setHoveredPhotoId(item.id)}
                onMouseLeave={() => setHoveredPhotoId(null)}
              >
                {item.type === 'video' ? (
                  <div
                    className="relative w-full h-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlayingVideo(item);
                    }}
                  >
                    <video src={item.url} className="w-full h-full object-cover rounded-xl" muted />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <svg width="18" height="18" viewBox="0 0 24 24" style={{ fill: 'var(--color-accent)' }}><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.6)' }}>
                      Video
                    </div>
                  </div>
                ) : (
                  <img src={item.url} alt="Media" className="w-full h-full object-cover rounded-xl" />
                )}

                {item.is_primary && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-lg backdrop-blur-sm" style={{ background: 'rgba(245, 158, 11, 0.9)' }}>
                    <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Primary
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Fullscreen hover zoom ── */}
          <div
            className="fixed inset-0 z-[110] pointer-events-none flex items-center justify-center p-10"
            style={{
              opacity: hoveredItem ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
            }}
          >
            {hoveredItem && (
              <>
                <div className="absolute inset-0" style={{ background: 'rgba(15, 23, 42, 0.80)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />
                <img
                  src={hoveredItem.url}
                  alt="Preview"
                  className="relative max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                  style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                />
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl flex items-center gap-3" style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {hoveredItem.is_primary && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgb(245, 158, 11)' }}>
                      <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      Primary
                    </span>
                  )}
                  <span className="text-[10px] font-medium" style={{ color: 'var(--color-navy-400)' }}>Move away to return</span>
                </div>
              </>
            )}
          </div>

          {/* ── Video Player Modal Overlay ── */}
          {playingVideo && (
            <div
              className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setPlayingVideo(null);
              }}
            >
              <div
                className="relative w-full max-w-4xl mx-4 aspect-video rounded-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <video
                  src={playingVideo?.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain bg-black"
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPlayingVideo(null);
                }}
                className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
