// app/modules/guestbook.jsx
'use client'
import React, { useState, useEffect, useRef } from 'react'
import styles from './guestbook.module.css'
import { ToastContainer, toast, Slide } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const Guestbook = ({ query, date }) => {
  const [inputMessage, setInputMessage] = useState('')
  const [inputName, setInputName]       = useState('')
  const [entries, setEntries]   = useState([])
  const [idx, setIdx]           = useState(0)
  const [fadeState, setFadeState] = useState('in') // 'in' or 'out'
  const pollRef                = useRef(null)
  const timerFadeOutRef        = useRef(null)
  const timerSwitchRef         = useRef(null)

  const fallbackEntries = [
    { name: 'error', message: '서버 연결에 실패했습니다.' },
    { name: 'warn', message: '데이터 로드에 실패했습니다.' },
    { name: '', message: '잠시 후 다시 시도해주세요.' },
  ]

  const fetchEntries = () => {
    const q = query || 'default'
    fetch(`/api/guestbook/read/${q}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.entries))
          setEntries(data.entries)
        else
          setEntries(fallbackEntries)
        setIdx(0)
        setFadeState('in')
      })
      .catch((error) => {
        console.warn("API 호출 에러: ", error);
        setEntries(fallbackEntries)
        setIdx(0)
        setFadeState('in')
      })
  }

  useEffect(() => {
    fetchEntries()
    pollRef.current = setInterval(fetchEntries, 30000)
    return () => clearInterval(pollRef.current)
  }, [query])

  useEffect(() => {
    if (!entries.length) return

    clearTimeout(timerFadeOutRef.current)
    clearTimeout(timerSwitchRef.current)

    setFadeState('in')

    const DISPLAY_DURATION = 1500

    timerFadeOutRef.current = setTimeout(() => {
      setFadeState('out')
    }, DISPLAY_DURATION)

    return () => clearTimeout(timerFadeOutRef.current)
  }, [entries, idx])

  useEffect(() => {
    if (fadeState !== 'out' || !entries.length) return

    const FADE_DURATION = 500

    timerSwitchRef.current = setTimeout(() => {
      setIdx(prev => (entries.length > 1 ? (prev + 1) % entries.length : 0))
      setFadeState('in')
    }, FADE_DURATION)

    return () => clearTimeout(timerSwitchRef.current)
  }, [fadeState, entries])

  const handleSubmit = async e => {
    e.preventDefault()
    const q = query || 'default'
    try {
      const res = await fetch(`/api/guestbook/write/${q}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage, name: inputName }),
      })
      if (res.ok) {
        setInputMessage('')
        setInputName('')
        toast.info('방명록 작성이 성공적으로 저장되었습니다.')
        fetchEntries()
      } else {
        console.warn("API 내부 에러러: ", error);
        toast.error('방명록 전송에 실패했습니다.')
      }
    } catch (err) {
      console.warn("API 호출 에러: ", error);
      toast.error('전송 중 에러 발생: ' + err.message)
    }
  }

  const current = entries[idx] || {}

  return (
    <div className={styles.content}>
      <div className={styles.header}>전하고 싶은 말</div>
      <form onSubmit={handleSubmit}>
        <textarea
          className={styles.guestbook}
          maxLength={183}
          placeholder="방명록을 남겨주세요"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
        />
        <input
          className={styles.guestbook}
          placeholder="이름"
          value={inputName}
          onChange={e => setInputName(e.target.value)}
        />
        <button type="submit" className={styles.submit}>
          등록
        </button>
      </form>
      
      {date < new Date() && ( // Only show the button if the date is in the past
        <div>
          <button
            className={styles.submit}
            style={{fontSize: "xx-large"}}
            onClick={() => {
              const urlParams = new URLSearchParams(window.location.search); // Extract query parameters from the URL
              const pathParam = urlParams.get("path"); // Get the `path` parameter

              if (pathParam) {
                window.open(`/share-photo?path=${encodeURIComponent(pathParam)}`, "_blank"); // Open with path param
              } else {
                window.open(`/share-photo`, "_blank"); // Notify the user if the path is not available
              }
            }}
          >
            사진 공유하기
          </button>
        </div>
      )}

      <div className={styles.wrapper}>
        {entries.length > 0 && (
          <div className={`${styles.message} ${fadeState === 'in' ? styles.slideIn : styles.slideOut}`}>
            <div className="content">{current.message}</div>
            {current.name && (
              <div className="little" style={{fontWeight: "bold"}}>{current.name}</div>
            )}
          </div>
        )}
      </div>

      <ToastContainer
        position="top-center"
        autoClose={2000}
        limit={1}
        hideProgressBar
        closeOnClick={false}
        draggable
        pauseOnHover
        theme="light"
        transition={Slide}
      />
    </div>
  )
}

export default Guestbook;