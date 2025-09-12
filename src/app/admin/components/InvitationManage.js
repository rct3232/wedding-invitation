'use client';

import { useEffect, useState } from 'react';
import InvitationEditor from './InvitationEditor';
import GalleryManager from './GalleryManager';
import UploadsManager from './UploadsManger';

export default function InvitationManage({ id, summary, csrf, onBack, onRefreshSummary }) {
  const [selectedEditor, setSelectedEditor] = useState(null);

  return (
    <>
      {!selectedEditor ? (
        <div>
          <button onClick={onBack}>돌아가기</button>
          <button onClick={() => setSelectedEditor('data')}>데이터 편집기</button>
          <button onClick={() => setSelectedEditor('gallery')}>갤러리 관리</button>
          <button onClick={() => setSelectedEditor('upload')}>업로드 관리</button>
        </div>
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