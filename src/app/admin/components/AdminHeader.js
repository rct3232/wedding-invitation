'use client';

export default function AdminHeader({ onLogout }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#111827', color: '#fff' }}>
      <div style={{ color: '#fff' }}>관리자 페이지</div>
      <button onClick={onLogout} style={{ padding: '.4rem .7rem', background: '#4B5563', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}>
        로그아웃
      </button>
    </div>
  );
}
