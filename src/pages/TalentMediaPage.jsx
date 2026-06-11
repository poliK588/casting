import React, { useState, useRef, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppContext } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';

/* ─── Constants ─── */
const LIMITS   = { image: 5, video: 2, audio: 3 };
const MAX_SIZES = { image: 5 * 1024 * 1024, video: 50 * 1024 * 1024, audio: 10 * 1024 * 1024 };
const TABS     = ['Photos', 'Videos', 'Audio'];
const ACCEPT   = { Photos: 'image/*', Videos: 'video/*', Audio: 'audio/*' };
const TYPE_KEY = { Photos: 'image', Videos: 'video', Audio: 'audio' };

const TrashIcon = () => (
  <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>
);

/* ─── UsageBar ─── */
const UsageBar = ({ count, max, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{count} / {max} {label}</span>
    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-[120px]">
      <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${(count / max) * 100}%` }} />
    </div>
  </div>
);

/* ─── Empty State ─── */
const Empty = ({ icon, title, sub, onUpload, uploading, label }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-4">{icon}</div>
    <p className="text-sm font-bold text-white/50 mb-1">{title}</p>
    <p className="text-xs text-white/25 mb-5">{sub}</p>
    <button onClick={onUpload} disabled={uploading}
      className="btn-primary h-9 px-5 !rounded-xl text-xs font-bold">
      Upload {label}
    </button>
  </div>
);

/* ─── Photo Card ─── */
const PhotoCard = ({ item, onDelete, onSetPrimary }) => (
  <div className="group relative aspect-square rounded-xl overflow-hidden border-2 transition-all border-white/10 hover:border-white/20">
    <img src={item.url} alt="" className="w-full h-full object-cover object-top" />
    {item.is_primary && (
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg backdrop-blur-sm z-10">
        <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        Primary
      </div>
    )}
    {/* Hover overlay */}
    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
      <div className="flex justify-end">
        <button onClick={() => onDelete(item)}
          className="w-8 h-8 rounded-lg bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors">
          <TrashIcon />
        </button>
      </div>
      {!item.is_primary && (
        <button onClick={() => onSetPrimary(item)}
          className="w-full h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold uppercase tracking-wider transition-colors backdrop-blur-sm">
          Set Primary
        </button>
      )}
    </div>
  </div>
);

/* ─── Video Card ─── */
const VideoCard = ({ item, onDelete, onPlay }) => (
  <div
    className="group relative aspect-video rounded-xl overflow-hidden border-2 border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer"
    onClick={() => onPlay(item)}
  >
    <video src={item.url} className="w-full h-full object-cover" muted preload="metadata" />
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-12 h-12 rounded-full bg-black/50 group-hover:bg-indigo-500/70 flex items-center justify-center backdrop-blur-sm transition-colors">
        <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </div>
    </div>
    {item.is_primary && (
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg backdrop-blur-sm">
        ★ Showreel
      </div>
    )}
    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full backdrop-blur-sm">
      Video
    </div>
    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2">
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(item); }}
        className="w-8 h-8 rounded-lg bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors">
        <TrashIcon />
      </button>
    </div>
  </div>
);

/* ─── Audio Row ─── */
const AudioRow = ({ item, onDelete }) => (
  <div className="flex items-center gap-4 py-3 px-4 border-b border-white/5 last:border-0 group hover:bg-white/[0.02] transition-colors">
    <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
      <svg width="16" height="16" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/>
      </svg>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-white truncate">{item.storage_path?.split('/').pop() || 'Audio file'}</p>
      <p className="text-[10px] text-white/25 mt-0.5">Audio</p>
    </div>
    <button onClick={() => onDelete(item)}
      className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 bg-red-500/15 hover:bg-red-500/30 flex items-center justify-center transition-all">
      <svg width="14" height="14" fill="none" stroke="#f87171" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
      </svg>
    </button>
  </div>
);

/* ─── Add Card (dashed) ─── */
const AddCard = ({ disabled, uploading, label, onAdd }) => (
  <button onClick={() => !disabled && onAdd()} disabled={disabled || uploading}
    className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all
      ${disabled ? 'border-white/5 opacity-30 cursor-not-allowed' : 'border-white/10 hover:border-indigo-500/40 hover:bg-white/[0.02] cursor-pointer'}`}>
    {uploading ? (
      <svg className="animate-spin h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    ) : (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-white/20">
        <path strokeLinecap="round" d="M12 5v14m-7-7h14"/>
      </svg>
    )}
    <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider">
      {disabled ? 'Max reached' : uploading ? 'Uploading...' : label}
    </span>
  </button>
);

/* ═══════════════════════════════════════
   Main Page
═══════════════════════════════════════ */
export default function TalentMediaPage() {
  const { mediaItems, refreshProfile, profile } = useAuth();
  const { showToast } = useContext(AppContext);
  const [tab, setTab] = useState('Photos');
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const fileRef = useRef(null);

  const photos  = (mediaItems || []).filter(m => m.type === 'image');
  const videos  = (mediaItems || []).filter(m => m.type === 'video');
  const audio   = (mediaItems || []).filter(m => m.type === 'audio');
  const counts  = { Photos: photos, Videos: videos, Audio: audio };
  const profileId = profile?.id;

  /* ─── Upload ─── */
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const typeKey = TYPE_KEY[tab];
    const current = counts[tab].length;
    const limit = LIMITS[typeKey];
    if (current + files.length > limit) {
      showToast?.(`Max ${limit} ${typeKey} files. You have ${current}.`);
      e.target.value = ''; return;
    }
    for (const f of files) {
      const k = f.type.startsWith('video/') ? 'video' : f.type.startsWith('audio/') ? 'audio' : 'image';
      if (f.size > MAX_SIZES[k]) {
        showToast?.(`${f.name} exceeds size limit.`);
        e.target.value = ''; return;
      }
    }
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');
      if (!profileId) throw new Error('Profile not found.');
      const isEmpty = !(mediaItems || []).length;
      await Promise.all(files.map(async (file, idx) => {
        const ext  = file.name.split('.').pop().toLowerCase();
        const safe = (profile.first_name || 'media').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);
        const path = `portfolio/${session.user.id}/${Date.now()}_${idx}_${safe}.${ext}`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
        const mType = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image';
        const isPrimary = isEmpty && idx === 0 && mType === 'image';
        const { error: dbErr } = await supabase.from('media').insert({
          profile_id: profileId, url: publicUrl, storage_path: path,
          type: mType, is_primary: isPrimary, display_order: (mediaItems?.length || 0) + idx,
        });
        if (dbErr) throw dbErr;
        if (isPrimary) await supabase.from('profiles').update({ image_url: publicUrl }).eq('id', profileId);
      }));
      await refreshProfile();
      showToast?.(`${files.length} file${files.length > 1 ? 's' : ''} uploaded!`);
    } catch (err) {
      console.error('Upload error:', err);
      showToast?.('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  /* ─── Delete ─── */
  const handleDelete = async (item) => {
    try {
      const { error } = await supabase.from('media').delete().eq('id', item.id);
      if (error) throw error;
      if (item.storage_path) await supabase.storage.from('avatars').remove([item.storage_path]);
      if (item.is_primary && profileId) {
        const { data: rest } = await supabase.from('media').select('*').eq('profile_id', profileId)
          .order('display_order', { ascending: true }).limit(1);
        if (rest?.length) {
          await supabase.from('media').update({ is_primary: true }).eq('id', rest[0].id);
          await supabase.from('profiles').update({ image_url: rest[0].url }).eq('id', profileId);
        } else {
          await supabase.from('profiles').update({ image_url: null }).eq('id', profileId);
        }
      }
      await refreshProfile();
      showToast?.('Media deleted.');
    } catch (err) {
      showToast?.('Delete failed: ' + err.message);
    }
  };

  /* ─── Set Primary ─── */
  const handleSetPrimary = async (item) => {
    if (item.is_primary) return;
    try {
      if (!profileId) return;
      await supabase.from('media').update({ is_primary: false }).eq('profile_id', profileId);
      await supabase.from('media').update({ is_primary: true }).eq('id', item.id);
      await supabase.from('profiles').update({ image_url: item.url }).eq('id', profileId);
      await refreshProfile();
      showToast?.('Primary photo updated!');
    } catch (err) {
      showToast?.('Failed: ' + err.message);
    }
  };

  const triggerUpload = () => fileRef.current?.click();

  const tabLabel = tab === 'Photos' ? 'Photo' : tab === 'Videos' ? 'Video' : 'Audio';

  return (
    <div className="px-6 py-5 flex flex-col h-full gap-5">
      {/* Hidden file input */}
      <input ref={fileRef} type="file" className="hidden" multiple
        accept={ACCEPT[tab]} onChange={handleUpload} />

      {/* ── Fixed Header & Tabs ── */}
      <div className="flex-shrink-0 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Media</h1>
            <p className="text-xs text-slate-400 mt-0.5">Manage your photos, videos and showreel.</p>
          </div>
          <button onClick={triggerUpload} disabled={uploading}
            className="btn-primary h-9 px-5 !rounded-xl text-xs font-bold flex items-center gap-2">
            {uploading ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M12 5v14m-7-7h14"/>
              </svg>
            )}
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-white/10">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-2.5 text-xs font-bold uppercase tracking-widest transition-all border-b-2 -mb-px
                ${tab === t ? 'text-white border-indigo-500' : 'text-white/30 border-transparent hover:text-white/50'}`}>
              {t}
              <span className="ml-1.5 text-[10px] font-semibold tabular-nums opacity-60">{counts[t].length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable Tab Content ── */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1">
        <div className="glass-panel !rounded-[14px] p-6 lift h-fit">

          {/* ═══ Photos ═══ */}
          {tab === 'Photos' && (
            <>
              <UsageBar count={photos.length} max={5} label="photos used" />
              {photos.length === 0 ? (
                <Empty
                  icon={<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path strokeLinecap="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/></svg>}
                  title="No photos yet"
                  sub="Upload your headshots and portfolio photos"
                  onUpload={triggerUpload}
                  uploading={uploading}
                  label={tabLabel}
                />
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {photos.map(p => (
                    <PhotoCard key={p.id} item={p} onDelete={setDeleteConfirm} onSetPrimary={handleSetPrimary} />
                  ))}
                  <AddCard disabled={photos.length >= 5} uploading={uploading} label="Add Photo" onAdd={triggerUpload} />
                </div>
              )}
            </>
          )}

          {/* ═══ Videos ═══ */}
          {tab === 'Videos' && (() => {
            const showreel = videos.find(v => v.is_primary);
            const otherVideos = videos.filter(v => !v.is_primary);
            return (
              <>
                <UsageBar count={videos.length} max={2} label="videos used" />

                {/* Showreel Hero Block */}
                {videos.length === 0 ? (
                  <div className="border-2 border-dashed border-white/10 rounded-xl aspect-video flex flex-col items-center justify-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/></svg>
                    </div>
                    <p className="text-sm font-bold text-white/50">Add your Demo Reel</p>
                    <p className="text-xs text-white/25">This is the first thing casting directors see</p>
                    <button onClick={triggerUpload} disabled={uploading}
                      className="btn-primary h-9 px-5 !rounded-xl text-xs font-bold mt-2">Upload Video</button>
                  </div>
                ) : showreel ? (
                  <div className="relative rounded-xl overflow-hidden aspect-video mb-4 border border-white/10">
                    <video src={showreel.url} className="w-full h-full object-cover" controls />
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-500/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg backdrop-blur-sm">
                      ★ Primary Showreel
                    </div>
                    <div className="absolute top-3 right-3 flex gap-2">
                      {videos.length < 2 && (
                        <button onClick={triggerUpload} disabled={uploading}
                          className="h-8 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold uppercase tracking-wider transition-colors backdrop-blur-sm">
                          Replace
                        </button>
                      )}
                      <button onClick={() => setDeleteConfirm(showreel)}
                        className="w-8 h-8 rounded-lg bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors">
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Other videos grid */}
                {otherVideos.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {otherVideos.map(v => (
                      <VideoCard key={v.id} item={v} onDelete={setDeleteConfirm} onPlay={setPlayingVideo} />
                    ))}
                    {videos.length < 2 && (
                      <AddCard disabled={false} uploading={uploading} label="Add Video" onAdd={triggerUpload} />
                    )}
                  </div>
                )}
                {videos.length > 0 && !otherVideos.length && videos.length < 2 && (
                  <button onClick={triggerUpload} disabled={uploading}
                    className="mt-3 h-9 px-5 border border-white/10 rounded-xl text-xs font-bold text-slate-400 hover:bg-white/5 transition-colors">
                    + Add Another Video
                  </button>
                )}
              </>
            );
          })()}

          {/* ═══ Audio ═══ */}
          {tab === 'Audio' && (
            <>
              <UsageBar count={audio.length} max={3} label="audio files" />
              {audio.length === 0 ? (
                <Empty
                  icon={<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/></svg>}
                  title="No audio files yet"
                  sub="Upload voice reels or audio samples"
                  onUpload={triggerUpload}
                  uploading={uploading}
                  label={tabLabel}
                />
              ) : (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  {audio.map(a => (
                    <AudioRow key={a.id} item={a} onDelete={setDeleteConfirm} />
                  ))}
                </div>
              )}
              {audio.length > 0 && audio.length < 3 && (
                <button onClick={triggerUpload} disabled={uploading}
                  className="mt-4 h-9 px-5 border border-white/10 rounded-xl text-xs font-bold text-slate-400 hover:bg-white/5 transition-colors">
                  + Add Audio
                </button>
              )}
            </>
          )}

        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel !rounded-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                <TrashIcon />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Delete {deleteConfirm.type === 'image' ? 'Photo' : deleteConfirm.type === 'video' ? 'Video' : 'Audio'}?
              </h3>
              <p className="text-sm text-white/40 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 h-11 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleDelete(deleteConfirm);
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Video Player Modal ── */}
      {playingVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setPlayingVideo(null)}
        >
          <div className="max-w-4xl w-full mx-4 aspect-video rounded-2xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={playingVideo.url}
              controls
              autoPlay
              className="w-full h-full object-contain bg-black"
            />
            <button
              onClick={() => setPlayingVideo(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
