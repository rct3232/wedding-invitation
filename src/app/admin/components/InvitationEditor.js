'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deepClone, setAt, pushAt, removeAtIndex } from './Utils';
import styles from './InvitationEditor.module.css';

export default function InvitationEditor({ id, summary, csrf, onBack, onRefreshSummary }) {
  const router = useRouter();
  const [invitationData, setInvitationData] = useState(null);
  const [invDraft, setInvDraft] = useState(null);
  const [invLoading, setInvLoading] = useState(false);
  const [invSaving, setInvSaving] = useState(false);
  const [invError, setInvError] = useState('');

  const hasUnsaved = useMemo(() => {
    return () => {
      try { return JSON.stringify(invitationData ?? {}) !== JSON.stringify(invDraft ?? {}); } catch { return true; }
    };
  }, [invitationData, invDraft]);

  const onChange = (path) => (e) => setInvDraft((prev) => setAt(prev, path, e.target.value));
  const onNumChange = (path) => (e) => {
    const v = e.target.value;
    const n = v === '' ? '' : Number(v);
    setInvDraft((prev) => setAt(prev, path, typeof n === 'number' && !Number.isNaN(n) ? n : 0));
  };

  const loadInvitationData = async () => {
    if (!id) return;
    setInvError('');
    setInvLoading(true);
    try {
      const r = await fetch(`/api/admin/invitation-data?id=${encodeURIComponent(id)}`, { cache: 'no-store', credentials: 'include' });
      if (r.status === 401) return router.replace('/admin/login');
      const data = r.ok ? await r.json() : {};
      setInvitationData(data);
      setInvDraft(deepClone(data));
    } catch {
      setInvError('불러오기 실패');
      setInvitationData({});
      setInvDraft({});
    } finally {
      setInvLoading(false);
    }
  };

  const saveInvitation = async () => {
    setInvError('');
    setInvSaving(true);
    try {
      const r = await fetch('/api/admin/invitation-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
        credentials: 'include',
        body: JSON.stringify({ id, data: invDraft ?? {} })
      });
      if (r.status === 401) return router.replace('/admin/login');
      if (!r.ok) throw new Error();
      setInvitationData(deepClone(invDraft ?? {}));
      alert('저장되었습니다.');
    } catch {
      setInvError('저장 실패');
    } finally {
      setInvSaving(false);
    }
  };

  const revertInvitation = () => {
    setInvError('');
    setInvDraft(deepClone(invitationData ?? {}));
  };

  const refreshInvitation = () => {
    loadInvitationData();
  };

  const del = async (type, name) => {
    if (!confirm('삭제하시겠습니까?')) return;
    const res = await fetch('/api/admin/delete-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
      credentials: 'include',
      body: JSON.stringify({ id, type, name })
    });
    if (res.ok) onRefreshSummary?.();
  };

  useEffect(() => { loadInvitationData(); }, [id]);

  return (
    <section className={styles.container}>
      <div className={styles.headerRow}>
        <button
          onClick={() => {
            if (hasUnsaved && hasUnsaved() && !confirm('변경사항이 저장되지 않았습니다. 나가시겠습니까?')) return;
            onBack?.();
          }}
          style={{ marginRight: '.75rem', padding: '.35rem .6rem', background: '#E5E7EB', border: 0, borderRadius: 6, cursor: 'pointer' }}
        >
          목록으로
        </button>
        <h2 style={{ margin: '.25rem 0' }}>{summary?.id}</h2>
        <div className={styles.spacer} />
        <div style={{ display: 'flex', gap: '.25rem'}}>
            <button onClick={saveInvitation} disabled={invSaving || invLoading} style={{ padding: '.35rem .6rem', background: '#2563EB', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}>
              {invSaving ? '저장 중...' : '저장'}
            </button>
            <button onClick={revertInvitation} disabled={invLoading || invSaving} style={{ padding: '.35rem .6rem', background: '#E5E7EB', border: 0, borderRadius: 6, cursor: 'pointer' }}>
              되돌리기
            </button>
            <button onClick={refreshInvitation} disabled={invLoading || invSaving} style={{ padding: '.35rem .6rem', background: '#F59E0B', color: '#111827', border: 0, borderRadius: 6, cursor: 'pointer' }}>
              새로고침
            </button>
          </div>
      </div>

      <div>
        <div className={styles.rowWrap}>
          {invLoading && <span style={{ color: '#6B7280' }}>불러오는 중...</span>}
          {hasUnsaved() && !invLoading && <span style={{ color: '#DC2626' }}>저장되지 않은 변경사항 있음</span>}
        </div>
        {invError && <div style={{ color: '#DC2626', marginBottom: '.5rem' }}>{invError}</div>}

        {invDraft && (
          <div className={`${styles.grid} ${styles.gridGapLg}`}>
            <div className={`${styles.grid} ${styles.gridGapLg}`} style={{background: '#F9FAFB', borderRadius: 8}}>
              {(invDraft.person || []).map((p, i) => (
                <div key={i} style={{ display: 'grid', gap: '.5rem', padding: '.75rem' }}>
                  <div className={styles.rowWrap}>
                    <p>인물 {i+1}</p>
                    <button className={styles.deleteButton} onClick={() => setInvDraft((prev) => removeAtIndex(prev, 'person', i))}>
                      삭제
                    </button>
                  </div>
                  <div className={styles.grid3equal}>
                    <input className={styles.inputBox} value={p.title || ''} onChange={onChange(`person.${i}.title`)} placeholder='제목(신랑/신부)'/>
                    <input className={styles.inputBox} value={p.order || ''} onChange={onChange(`person.${i}.order`)} placeholder='호칭(아들/딸)'/>
                    <input type='color' value={p.color || '#D9D4CF'} onChange={onChange(`person.${i}.color`)} title='색상' />
                  </div>

                  <div className={styles.grid2}>
                    <input className={styles.inputBox} value={p?.name?.kor?.last || ''} onChange={onChange(`person.${i}.name.kor.last`)} placeholder='성(한글)'/>
                    <input className={styles.inputBox} value={p?.name?.kor?.first || ''} onChange={onChange(`person.${i}.name.kor.first`)} placeholder='이름(한글)'/>
                    <input className={styles.inputBox} value={p?.name?.eng?.last || ''} onChange={onChange(`person.${i}.name.eng.last`)} placeholder='성(영문)'/>
                    <input className={styles.inputBox} value={p?.name?.eng?.first || ''} onChange={onChange(`person.${i}.name.eng.first`)} placeholder='이름(영문)'/>
                  </div>

                  <div className={styles.grid3equal}>
                    <input className={styles.inputBox} value={p?.bank?.name || ''} onChange={onChange(`person.${i}.bank.name`)} placeholder='은행명'/>
                    <input className={styles.inputBox} value={p?.bank?.account || ''} onChange={onChange(`person.${i}.bank.account`)} placeholder='계좌번호'/>
                    <input className={styles.inputBox} value={p?.bank?.kakao || ''} onChange={onChange(`person.${i}.bank.kakao`)} placeholder='카카오페이 링크(선택)'/>
                  </div>

                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '.5rem' }}>
                    <div className={`${styles.grid} ${styles.gridGapLg}`}>
                      {(p.parent || []).map((par, j) => (
                        <div key={j} style={{ display: 'grid', gap: '.5rem' }}>
                          <div className={styles.rowWrap}>
                            <p>부모님 {j+1}</p>
                            <button className={styles.deleteButton} onClick={() => setInvDraft((prev) => removeAtIndex(prev, `person.${i}.parent`, j))}>
                              삭제
                            </button>
                          </div>
                          <div className={styles.grid2}>
                            <input className={styles.inputBox} value={par.title || ''} onChange={onChange(`person.${i}.parent.${j}.title`)} placeholder='호칭(아버지/어머니)'/>
                            <input className={styles.inputBox} value={par.name || ''} onChange={onChange(`person.${i}.parent.${j}.name`)} placeholder='이름'/>
                          </div>
                          <div className={styles.grid3equal}>
                            <input className={styles.inputBox} value={par?.bank?.name || ''} onChange={onChange(`person.${i}.parent.${j}.bank.name`)} placeholder='은행명(선택)'/>
                            <input className={styles.inputBox} value={par?.bank?.account || ''} onChange={onChange(`person.${i}.parent.${j}.bank.account`)} placeholder='계좌번호(선택)'/>
                            <input className={styles.inputBox} value={par?.bank?.kakao || ''} onChange={onChange(`person.${i}.parent.${j}.bank.kakao`)} placeholder='카카오페이(선택)'/>
                          </div>
                        </div>
                      ))}
                      <button
                        className={styles.button}
                        onClick={() =>
                          setInvDraft((prev) =>
                            pushAt(prev, `person.${i}.parent`, {
                              title: '',
                              name: '',
                              bank: { name: '', account: '', kakao: '' }
                            })
                          )
                        }
                      >
                        + 추가
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                className={styles.button}
                onClick={() =>
                  setInvDraft((prev) =>
                    pushAt(prev, 'person', {
                      title: '',
                      name: { kor: { first: '', last: '' }, eng: { first: '', last: '' } },
                      order: '',
                      parent: [],
                      bank: { name: '', account: '', kakao: '' },
                      color: '#D9D4CF'
                    })
                  )
                }
              >
                + 추가
              </button>
            </div>

            {/* content section */}
            <div className={`${styles.grid} ${styles.gridGapLg}`} style={{background: '#F9FAFB', borderRadius: 8}}>
              <div style={{ padding: '.75rem' }}>
                <h4 style={{ margin: 0 }}>컨텐츠</h4>
                <div className={styles.grid} style={{ marginTop: '.5rem' }}>
                  <input className={styles.inputBox} value={invDraft?.content?.date || ''} onChange={onChange('content.date')} placeholder='날짜 (예: 2025-09-28T12:00:00+0900)'/>
                  <textarea className={styles.inputBox} value={invDraft?.content?.greeting || ''} onChange={onChange('content.greeting')} placeholder='인사말' rows={3}/>
                  <div className={styles.inputRowNarrow}>
                    <input className={styles.inputBox} value={invDraft?.content?.splashText || ''} onChange={onChange('content.splashText')} placeholder='splashText'/>
                    <input className={styles.inputBox} type='number' min={0} max={1} value={invDraft?.content?.colorInvert ?? 0} onChange={onNumChange('content.colorInvert')} placeholder='colorInvert (0/1)'/>
                  </div>

                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '.5rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '.25rem' }}>Confetti</div>
                    <input className={styles.inputBox} value={invDraft?.content?.confetti?.shape || ''} onChange={onChange('content.confetti.shape')} placeholder='shape'/>
                    <div className={styles.rowWrap}>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>색상</div>
                      <div className={styles.spacer} />
                      <button
                        onClick={() => setInvDraft((prev) => pushAt(prev, 'content.confetti.color', '#000000'))}
                        style={{ padding: '.25rem .6rem', background: '#10B981', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}
                      >
                        + 색상
                      </button>
                    </div>
                    <div className={styles.grid} style={{ marginTop: '.5rem' }}>
                      {(invDraft?.content?.confetti?.color || []).map((c, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                          <input type='color' value={c} onChange={onChange(`content.confetti.color.${idx}`)} />
                          <input className={styles.inputBox} value={c} onChange={onChange(`content.confetti.color.${idx}`)}/>
                          <button onClick={() => setInvDraft((prev) => removeAtIndex(prev, 'content.confetti.color', idx))} style={{ padding: '.25rem .6rem', background: '#DC2626', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}>
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* place section */}
            <section className={styles.section}>
              <h4 style={{ margin: 0 }}>장소 (place)</h4>
              <div className={styles.grid} style={{ marginTop: '.5rem' }}>
                <div className={styles.grid2}>
                  <input className={styles.inputBox} value={invDraft?.place?.address?.name || ''} onChange={onChange('place.address.name')} placeholder='장소명'/>
                  <input className={styles.inputBox} value={invDraft?.place?.address?.address || ''} onChange={onChange('place.address.address')} placeholder='주소'/>
                </div>

                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '.5rem' }}>
                  <div className={styles.rowWrap}>
                    <div style={{ fontWeight: 600 }}>오시는 길 (route)</div>
                    <div className={styles.spacer} />
                    <button
                      onClick={() => setInvDraft((prev) => pushAt(prev, 'place.route', { type: '', content: [] }))}
                      style={{ padding: '.25rem .6rem', background: '#10B981', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}
                    >
                      + 추가
                    </button>
                  </div>
                  <div className={styles.grid} style={{ marginTop: '.5rem' }}>
                    {(invDraft?.place?.route || []).map((r, i) => (
                      <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '.5rem' }}>
                        <div className={styles.rowWrap} style={{ marginBottom: '.5rem' }}>
                          <input className={styles.inputBox} value={r.type || ''} onChange={onChange(`place.route.${i}.type`)} placeholder='구분 (대중교통/주차 등)'/>
                          <button onClick={() => setInvDraft((prev) => removeAtIndex(prev, 'place.route', i))} style={{ padding: '.25rem .6rem', background: '#DC2626', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}>
                            삭제
                          </button>
                        </div>
                        <div className={styles.rowWrap}>
                          <div style={{ fontSize: 13, color: '#6B7280' }}>내용</div>
                          <div className={styles.spacer} />
                          <button
                            onClick={() => setInvDraft((prev) => pushAt(prev, `place.route.${i}.content`, ''))}
                            style={{ padding: '.25rem .6rem', background: '#10B981', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}
                          >
                            + 항목
                          </button>
                        </div>
                        <div className={styles.grid} style={{ marginTop: '.5rem' }}>
                          {(r.content || []).map((c, j) => (
                            <div key={j} className={styles.grid2Auto}>
                              <textarea className={styles.inputBox} value={c} onChange={onChange(`place.route.${i}.content.${j}`)} rows={2} placeholder='내용'/>
                              <button onClick={() => setInvDraft((prev) => removeAtIndex(prev, `place.route.${i}.content`, j))} style={{ padding: '.25rem .6rem', background: '#DC2626', color: '#fff', border: 0, borderRadius: 6, height: 'fit-content' }}>
                                삭제
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '.5rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '.25rem' }}>지도 (map)</div>
                  <div className={styles.mapGrid}>
                    <input className={styles.inputBox} type='number' step='any' value={invDraft?.place?.map?.pos?.lat ?? 0} onChange={onNumChange('place.map.pos.lat')} placeholder='pos.lat'/>
                    <input className={styles.inputBox} type='number' step='any' value={invDraft?.place?.map?.pos?.lng ?? 0} onChange={onNumChange('place.map.pos.lng')} placeholder='pos.lng'/>
                    <input className={styles.inputBox} type='number' step='any' value={invDraft?.place?.map?.center?.lat ?? 0} onChange={onNumChange('place.map.center.lat')} placeholder='center.lat'/>
                    <input className={styles.inputBox} type='number' step='any' value={invDraft?.place?.map?.center?.lng ?? 0} onChange={onNumChange('place.map.center.lng')} placeholder='center.lng'/>
                    <input className={styles.inputBox} type='number' value={invDraft?.place?.map?.zoom ?? 15} onChange={onNumChange('place.map.zoom')} placeholder='zoom'/>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      <div className={styles.bottomGrid2}>
        <div>
          <h3 style={{ margin: '.25rem 0 .5rem' }}>갤러리(full)</h3>
          <ul className={styles.listScrollable}>
            {(summary?.full || []).length === 0 ? (
              <li>없음</li>
            ) : (
              summary.full.map(n => (
                <li key={n}>
                  <a href={`/api/image/${summary.id}/${encodeURIComponent(n)}`} target="_blank" rel="noopener noreferrer">{n}</a>
                  <button onClick={() => del('full', n)} style={{ marginLeft: '.5rem', padding: '.25rem .6rem', background: '#DC2626', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}>
                    삭제
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <h3 style={{ margin: '.25rem 0 .5rem' }}>업로드(uploads)</h3>
          <ul className={styles.listScrollable}>
            {(summary?.uploads || []).length === 0 ? (
              <li>없음</li>
            ) : (
              summary.uploads.map(n => (
                <li key={n}>
                  <a href={`/api/admin/uploads/${summary.id}/${encodeURIComponent(n)}`} target="_blank" rel="noopener noreferrer">{n}</a>
                  <button onClick={() => del('uploads', n)} style={{ marginLeft: '.5rem', padding: '.25rem .6rem', background: '#DC2626', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}>
                    삭제
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
