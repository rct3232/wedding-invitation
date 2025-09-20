'use client';

import { useEffect, useState } from 'react';

export default function UploadsManager({ id, summary, csrf, onBack, onRefreshSummary }) {
  const [images, setImages] = useState(() => summary?.uploads || []);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null); // file name to preview
  const [missing, setMissing] = useState(() => new Set()); // files not found on disk

  useEffect(() => {
    setImages(summary?.uploads || []);
    setSelected(new Set());
    setMissing(new Set());
  }, [summary]);

  const fileUrl = (name) => `/api/admin/uploads/${encodeURIComponent(id)}/${encodeURIComponent(name)}`;

  const toggleSelect = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(images));
  const clearSelection = () => setSelected(new Set());

  const handleDeleteSingle = async (name) => {
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
        body: JSON.stringify({ id, type: 'uploads', name })
      });
      if (!res.ok) throw new Error('delete failed');
      setImages((prev) => prev.filter((n) => n !== name));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
      setMissing((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
      onRefreshSummary?.();
    } catch {
      alert('삭제에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSelected = async () => {
    const targets = Array.from(selected);
    if (targets.length === 0) return;
    if (!confirm(`선택한 ${targets.length}개 사진을 삭제하시겠습니까?`)) return;
    try {
      setBusy(true);
      await Promise.all(
        targets.map(async (name) => {
          const res = await fetch('/api/admin/delete-file', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': csrf
            },
            body: JSON.stringify({ id, type: 'uploads', name })
          });
          if (!res.ok) throw new Error('delete failed: ' + name);
        })
      );
      setImages((prev) => prev.filter((n) => !selected.has(n)));
      setSelected(new Set());
      setMissing((prev) => {
        const next = new Set(prev);
        for (const n of targets) next.delete(n);
        return next;
      });
      onRefreshSummary?.();
    } catch (e) {
      alert('일부 파일 삭제에 실패했습니다.\n' + (e?.message || ''));
    } finally {
      setBusy(false);
    }
  };

  // Replace: bulk download as a single ZIP
  const handleDownloadSelected = async () => {
    const targets = Array.from(selected).filter((n) => !missing.has(n));
    if (targets.length === 0) {
      alert('다운로드할 수 있는 파일이 없습니다.');
      return;
    }
    try {
      setBusy(true);
      const res = await fetch('/api/admin/uploads-zip', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrf
        },
        body: JSON.stringify({ id, names: targets })
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || 'zip failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uploads_${id}_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('압축 다운로드에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const markMissing = (name) => {
    setMissing((prev) => {
      if (prev.has(name)) return prev;
      const next = new Set(prev);
      next.add(name);
      return next;
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={onBack} disabled={busy}>뒤로</button>
        <div style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>
          선택: {selected.size} / 전체: {images.length}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={selectAll} disabled={busy || images.length === 0}>전체선택</button>
          <button onClick={clearSelection} disabled={busy || selected.size === 0}>선택해제</button>
          <button onClick={handleDownloadSelected} disabled={busy || selected.size === 0}>선택 다운로드</button>
          <button onClick={handleDeleteSelected} disabled={busy || selected.size === 0}>선택 삭제</button>
        </div>
      </div>

      {images.length === 0 ? (
        <div style={{ background: '#fff', padding: '1rem', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.06)' }}>
          업로드된 사진이 없습니다.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))'
          }}
        >
          {images.map((name) => {
            const isMissing = missing.has(name);
            return (
              <div key={name} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#f7f7f7', minHeight: 160 }}>
                {!isMissing ? (
                  <img
                    src={fileUrl(name)}
                    alt={name}
                    loading="lazy"
                    onClick={() => setPreview(name)}
                    style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                    onError={() => markMissing(name)}
                  />
                ) : (
                  <div
                    onClick={() => {}}
                    style={{ width: '100%', height: 160, display: 'grid', placeItems: 'center', color: '#999', fontSize: 12, background: '#fafafa' }}
                    title="파일을 찾을 수 없습니다 (DB 기록만 존재)"
                  >
                    파일 없음
                  </div>
                )}

                <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={selected.has(name)}
                    onChange={() => toggleSelect(name)}
                    disabled={busy}
                    style={{ width: 18, height: 18 }}
                    title="선택"
                  />
                </div>

                <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleDeleteSingle(name)}
                    disabled={busy}
                    style={{ padding: '4px 8px', fontSize: 12, background: '#fff', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}
                  >
                    삭제
                  </button>
                </div>

                {isMissing && (
                  <div style={{
                    position: 'absolute', bottom: 6, right: 6, background: '#fff3cd', color: '#856404',
                    border: '1px solid #ffeeba', borderRadius: 6, padding: '2px 6px', fontSize: 11
                  }}>
                    DB만 존재
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {preview && !missing.has(preview) && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'grid', placeItems: 'center', zIndex: 1000
          }}
        >
          <div style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={fileUrl(preview)}
              alt={preview}
              style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'block', borderRadius: 8, background: '#000' }}
              onError={() => setPreview(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
