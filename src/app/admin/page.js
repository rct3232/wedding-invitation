'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from './components/AdminHeader';
import InvitationList from './components/InvitationList';
import InvitationEditor from './components/InvitationEditor';

/* ========= Page ========= */
export default function AdminPage() {
  const router = useRouter();
  const [csrf, setCsrf] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const load = async () => {
    try {
      const t = await fetch('/api/admin/csrf', { cache: 'no-store', credentials: 'include' }).then(r => r.json());
      setCsrf(t.csrf || '');
      const d = await fetch('/api/admin/summary', { cache: 'no-store', credentials: 'include' });
      if (d.status === 401) return router.replace('/admin/login');
      const j = await d.json();
      setItems(j.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selectedId && !items.some(i => i.id === selectedId)) {
      setSelectedId(null);
    }
  }, [items, selectedId]);

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', headers: { 'x-csrf-token': csrf }, credentials: 'include' });
    router.replace('/admin/login');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  const selectedItem = selectedId ? items.find(i => i.id === selectedId) : null;

  return (
    <div>
      <AdminHeader onLogout={logout} />
      <div style={{ maxWidth: 1000, margin: '1.5rem auto', padding: '0 1rem' }}>
        {items.length === 0 ? (
          <div style={{ background: '#fff', padding: '1rem', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.06)' }}>
            초대장이 없습니다.
          </div>
        ) : !selectedItem ? (
          <InvitationList items={items} onSelect={(id) => setSelectedId(id)} />
        ) : (
          <InvitationEditor
            id={selectedItem.id}
            summary={selectedItem}
            csrf={csrf}
            onBack={() => setSelectedId(null)}
            onRefreshSummary={load}
          />
        )}
      </div>
    </div>
  );
}
