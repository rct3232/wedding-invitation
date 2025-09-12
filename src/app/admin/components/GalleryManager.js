'use client';

import { useEffect, useMemo, useState } from 'react';

export default function GalleryManager({ id, summary, csrf, onBack, onRefreshSummary }) {
  const [images, setImages] = useState(() => summary?.full || []);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null); // file name to preview

  useEffect(() => {
    setImages(summary?.full || []);
  }, [summary]);

  const thumbUrl = (name) => `/api/admin/thumbs/${encodeURIComponent(id)}/${encodeURIComponent('thumb_' + name)}`;
  const fullUrl = (name) => `/api/image/${encodeURIComponent(id)}/${encodeURIComponent(name)}`;

  const handleDelete = async (name) => {
    if (!confirm(`정말로 삭제하시겠습니까?\n${name}`)) return;
    try {
      setBusy(true);
      const res = await fetch('/api/admin/delete-file', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrf
        },
        body: JSON.stringify({ id, type: 'full', name })
      });
      if (!res.ok) throw new Error('delete failed');
      // Optimistic UI update
      setImages((prev) => prev.filter((n) => n !== name));
      onRefreshSummary?.();
    } catch {
      alert('삭제에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      for (const f of files) {
        const fd = new FormData();
        fd.append('image', f);
        const res = await fetch(`/api/admin/full-upload/${encodeURIComponent(id)}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'x-csrf-token': csrf },
          body: fd
        });
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          throw new Error('upload failed: ' + t);
        }
      }
      onRefreshSummary?.();
    } catch (err) {
      alert('error: ' + err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button onClick={onBack} disabled={busy}>뒤로</button>
        <label style={{ marginLeft: 'auto' }}>
          <span style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', background: busy ? '#f5f5f5' : '#fff' }}>
            사진 추가
          </span>
          <input
            type="file"
            multiple
            accept="image/jpeg"
            onChange={handleUpload}
            style={{ display: 'none' }}
            disabled={busy}
          />
        </label>
      </div>

      {images.length === 0 ? (
        <div style={{ background: '#fff', padding: '1rem', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.06)' }}>
          갤러리에 사진이 없습니다.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))'
          }}
        >
          {images.map((name) => (
            <div key={name} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#f7f7f7' }}>
              <img
                src={thumbUrl(name)}
                alt={name}
                onClick={() => setPreview(name)}
                style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                onError={(e) => { e.currentTarget.src = fullUrl(name); }}
              />
              <div style={{
                position: 'absolute', top: 6, right: 6, display: 'flex', gap: 6
              }}>
                <button
                  onClick={() => handleDelete(name)}
                  disabled={busy}
                  style={{ padding: '4px 8px', fontSize: 12, background: '#fff', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'grid', placeItems: 'center', zIndex: 1000
          }}
        >
          <div style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={fullUrl(preview)}
              alt={preview}
              style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'block', borderRadius: 8, background: '#000' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
