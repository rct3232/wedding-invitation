'use client';

export default function InvitationList({ items, onSelect }) {
  return (
    <section style={{ background: '#fff', padding: '1rem', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.06)' }}>
      <h2 style={{ margin: '.25rem 0 1rem' }}>초대장 목록</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map(({ id, guestCnt, full, uploads }) => (
          <li key={id} style={{ marginBottom: '.5rem' }}>
            <button
              onClick={() => onSelect(id)}
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
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <strong>{id}</strong>
                <div style={{ flex: 1 }} />
                <span style={{ color: '#6B7280', fontSize: 13 }}>
                  방명록 {guestCnt}건 • 갤러리 {Array.isArray(full) ? full.length : 0} • 업로드 {Array.isArray(uploads) ? uploads.length : 0}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
