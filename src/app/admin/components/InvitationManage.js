'use client';

import { useState } from 'react';
import InvitationEditor from './InvitationEditor';
import GalleryManager from './GalleryManager';
import UploadsManager from './UploadsManger';

export default function InvitationManage({ id, summary, csrf, onBack, onRefreshSummary }) {
  const [selectedEditor, setSelectedEditor] = useState(null);

  return (
    <>
      {!selectedEditor ? (
        <section style={{ background: '#fff', padding: '1rem', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ margin: '.25rem 0 1rem' }}>{summary?.id}</h2>
            <button
              onClick={onBack}
              style={{
                width: 'auto',
                textAlign: 'left',
                padding: '.75rem 1rem',
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >돌아가기</button>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li key={id} style={{ marginBottom: '.5rem' }}>
                <button
                  onClick={() => setSelectedEditor('data')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '.75rem 1rem',
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  데이터 편집기
                </button>
              </li>
              <li key={id} style={{ marginBottom: '.5rem' }}>
                <button
                  onClick={() => setSelectedEditor('gallery')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '.75rem 1rem',
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  갤러리 관리
                </button>
              </li>
              <li key={id} style={{ marginBottom: '.5rem' }}>
                <button
                  onClick={() => setSelectedEditor('upload')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '.75rem 1rem',
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  업로드 관리
                </button>
              </li>
          </ul>
        </section>
      ) : selectedEditor === 'data' ? (
        <InvitationEditor
          id={id}
          summary={summary}
          csrf={csrf}
          onBack={() => setSelectedEditor(null)}
          onRefreshSummary={onRefreshSummary}
        />
      ) : selectedEditor === 'gallery' ? (
        <div>
          <GalleryManager
            id={id}
            summary={summary}
            csrf={csrf}
            onBack={() => setSelectedEditor(null)}
            onRefreshSummary={onRefreshSummary}
          />
        </div>
      ) : selectedEditor === 'upload' ? (
        <div>
          <UploadsManager
            id={id}
            summary={summary}
            csrf={csrf}
            onBack={() => setSelectedEditor(null)}
            onRefreshSummary={onRefreshSummary}
          />
        </div>
      ) : (
        <div>
          <p>에러가 발생했습니다</p>
          <button onClick={onBack}>돌아가기기</button>
        </div>
      )}
    </>
  );
}