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
          <div className={styles.gridGapLg}>
            <div className={`${styles.section} ${styles.grid}`}>
              {(invDraft.person || []).map((p, i) => (
                <div className={styles.grid} key={i}>
                  <div className={styles.rowWrap}>
                    <p>인물 {i+1}</p>
                    <button className={styles.deleteButton} onClick={() => setInvDraft((prev) => removeAtIndex(prev, 'person', i))}>
                      삭제
                    </button>
                  </div>
                  <div className={styles.grid2}>
                    <input className={styles.inputBox} value={p.title || ''} onChange={onChange(`person.${i}.title`)} placeholder='제목(신랑/신부)'/>
                    <input className={styles.inputBox} value={p.order || ''} onChange={onChange(`person.${i}.order`)} placeholder='호칭(아들/딸)'/>
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
                    <div className={styles.grid2LongShort}>
                      <input className={styles.inputBox} value={p?.bank?.kakao || ''} onChange={onChange(`person.${i}.bank.kakao`)} placeholder='카카오페이 링크(선택)'/>
                      <input className={styles.colorPicker} type='color' value={p.color || '#D9D4CF'} onChange={onChange(`person.${i}.color`)} title='색상' />
                    </div>
                  </div>

                  <div className={styles.section}>
                    <div className={styles.gridGapLg}>
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
                        className={styles.addButton}
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
                className={styles.addButton}
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

            <div className={styles.section}>
              <div className={styles.grid}>
                <div className={styles.section}>
                  <div className={styles.grid}>
                  <p>내용</p>
                    <input className={styles.inputBox} value={invDraft?.content?.date || ''} onChange={onChange('content.date')} placeholder='날짜 (예: 2025-09-28T12:00:00+0900)'/>
                    <textarea className={styles.inputTextArea} value={invDraft?.content?.greeting || ''} onChange={onChange('content.greeting')} placeholder='인사말' rows={3}/>
                    <div className={styles.grid2auto}>
                      <input className={styles.inputBox} value={invDraft?.content?.splashText || ''} onChange={onChange('content.splashText')} placeholder='splashText'/>
                      <div className={styles.grid2}>
                        <div className={styles.grid2auto}>
                          <input type='radio' value={0} checked={invDraft?.content?.colorInvert === 0} onChange={onNumChange('content.colorInvert')}/>
                          <label>흰색</label>
                        </div>
                        <div className={styles.grid2auto}>
                          <input type='radio' value={1} checked={invDraft?.content?.colorInvert === 1} onChange={onNumChange('content.colorInvert')}/>
                          <label>검정색</label>  
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`${styles.section} ${styles.grid}`}>
                  <div className={styles.grid}>
                    <p>Confetti</p>
                    <input className={styles.inputBox} value={invDraft?.content?.confetti?.shape || ''} onChange={onChange('content.confetti.shape')} placeholder='shape'/>
                  </div>
                  <div className={styles.repeatGrid}>
                    {(invDraft?.content?.confetti?.color || []).map((c, idx) => (
                      <div className={styles.grid2auto} key={idx}>
                        <div className={styles.grid2ShortLong}>
                          <input className={styles.colorPicker} type='color' value={c} onChange={onChange(`content.confetti.color.${idx}`)} />
                          <input className={styles.inputBox} value={c} onChange={onChange(`content.confetti.color.${idx}`)}/>
                        </div>
                        <button className={styles.deleteButton} onClick={() => setInvDraft((prev) => removeAtIndex(prev, 'content.confetti.color', idx))}>
                          삭제
                        </button>
                      </div>
                    ))}
                    <button
                      className={styles.addButton}
                      onClick={() => setInvDraft((prev) => pushAt(prev, 'content.confetti.color', '#000000'))}
                    >
                      + 추가
                    </button>
                  </div>
                </div>

                <div className={`${styles.section} ${styles.grid}`}>
                  <p>장소</p>
                  <div className={styles.grid2}>
                    <input className={styles.inputBox} value={invDraft?.place?.address?.name || ''} onChange={onChange('place.address.name')} placeholder='장소명'/>
                    <input className={styles.inputBox} value={invDraft?.place?.address?.address || ''} onChange={onChange('place.address.address')} placeholder='주소'/>
                  </div>
                  <div className={`${styles.section} ${styles.grid}`}>
                    {(invDraft?.place?.route || []).map((r, i) => (
                      <div className={styles.grid} key={i}>
                        <div className={styles.grid2auto}>
                          <input className={styles.inputBox} value={r.type || ''} onChange={onChange(`place.route.${i}.type`)} placeholder='구분 (대중교통/주차 등)'/>
                          <button className={styles.deleteButton} onClick={() => setInvDraft((prev) => removeAtIndex(prev, 'place.route', i))}>
                            삭제
                          </button>
                        </div>
                        <div className={`${styles.section} ${styles.grid}`}>
                          {(r.content || []).map((c, j) => (
                            <div key={j} className={styles.grid}>
                              <div className={styles.rowWrap}>
                                <p>내용 {j+1}</p>
                                <button className={styles.deleteButton} onClick={() => setInvDraft((prev) => removeAtIndex(prev, `place.route.${i}.content`, j))}>
                                  삭제
                                </button>
                              </div>
                              <textarea className={styles.inputTextArea} value={c} onChange={onChange(`place.route.${i}.content.${j}`)} rows={2} placeholder='내용'/>
                            </div>
                          ))}
                          <button
                            className={styles.addButton}
                            onClick={() => setInvDraft((prev) => pushAt(prev, `place.route.${i}.content`, ''))}
                          >
                            + 추가
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      className={styles.addButton}
                      onClick={() => setInvDraft((prev) => pushAt(prev, 'place.route', { type: '', content: [] }))}
                    >
                      + 추가
                    </button>
                  </div>

                  <div className={`${styles.section} ${styles.grid}`}>
                    <p>location point</p>
                    <div className={styles.grid2}>
                      <div className={styles.grid2ShortLong}>
                        <p style={{textAlign: 'Center'}}>lat</p>
                        <input className={styles.inputBox} type='number' step='any' value={invDraft?.place?.map?.pos?.lat ?? 0} onChange={onNumChange('place.map.pos.lat')} placeholder='pos.lat'/>
                      </div>
                      <div className={styles.grid2ShortLong}>
                        <p style={{textAlign: 'Center'}}>lng</p>
                        <input className={styles.inputBox} type='number' step='any' value={invDraft?.place?.map?.pos?.lng ?? 0} onChange={onNumChange('place.map.pos.lng')} placeholder='pos.lng'/>
                      </div>
                    </div>
                    <p>center point</p>
                    <div className={styles.grid2}>
                      <div className={styles.grid2ShortLong}>
                        <p style={{textAlign: 'Center'}}>lat</p>
                        <input className={styles.inputBox} type='number' step='any' value={invDraft?.place?.map?.center?.lat ?? 0} onChange={onNumChange('place.map.center.lat')} placeholder='center.lat'/>
                      </div>
                      <div className={styles.grid2ShortLong}>
                        <p style={{textAlign: 'Center'}}>lng</p>
                        <input className={styles.inputBox} type='number' step='any' value={invDraft?.place?.map?.center?.lng ?? 0} onChange={onNumChange('place.map.center.lng')} placeholder='center.lng'/>
                      </div>
                    </div>
                    <div className={styles.grid}>
                      <p>zoom</p>
                      <input className={styles.inputBox} type='number' value={invDraft?.place?.map?.zoom ?? 15} onChange={onNumChange('place.map.zoom')} placeholder='zoom'/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
