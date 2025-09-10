'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [csrf, setCsrf] = useState('');
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/admin/csrf', { cache: 'no-store', credentials: 'include' })
      .then(r => r.json())
      .then(d => setCsrf(d.csrf || ''))
      .catch(() => setErr('일시적인 오류가 발생했습니다.'));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrf
      },
      credentials: 'include',
      body: JSON.stringify({ id, pw })
    });
    if (res.ok) {
      router.push('/admin');
    } else {
      setErr('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 360, background: '#fff', padding: '1.5rem', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.08)' }}>
        <h1 style={{ margin: 0, fontSize: '1.1rem' }}>관리자 로그인</h1>
        <form onSubmit={onSubmit} style={{ marginTop: '1rem' }}>
          <label htmlFor="id" style={{ display: 'block', fontSize: '.9rem', marginBottom: '.25rem' }}>아이디</label>
          <input id="id" value={id} onChange={e => setId(e.target.value)} required style={{ width: '100%', padding: '.6rem .7rem', border: '1px solid #ddd', borderRadius: 8 }} />
          <label htmlFor="pw" style={{ display: 'block', fontSize: '.9rem', marginTop: '.75rem', marginBottom: '.25rem' }}>비밀번호</label>
          <input id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)} required style={{ width: '100%', padding: '.6rem .7rem', border: '1px solid #ddd', borderRadius: 8 }} />
          {err && <div style={{ color: '#b00020', marginTop: '.5rem' }}>{err}</div>}
          <button type="submit" style={{ marginTop: '1rem', width: '100%', padding: '.7rem', background: '#111827', color: '#fff', border: 0, borderRadius: 8, cursor: 'pointer' }}>
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
