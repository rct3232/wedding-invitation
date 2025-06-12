"use client"

import React, { useState } from 'react';
import styles from './guestbook.module.css';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Guestbook = ({ query }) => {
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); // 폼 제출 시 페이지 리로드 방지
    
    // 전송할 데이터 구성
    const data = { message, name };

    try {
      const response = await fetch(`/api/guestbook/${query}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setMessage('');
        setName('');
        toast.info('방명록 작성이 성공적으로 저장되었습니다.');
      } else {
        alert('방명록 전송에 실패했습니다.');
      }
    } catch (error) {
      alert('전송 중 에러 발생: ' + error.message);
    }
  };

  return (
    <div className={styles.content}>
      <div className="header">전하고 싶은 말</div>
      <form onSubmit={handleSubmit}>
        <textarea
          className={styles.guestbook}
          maxLength="183"
          placeholder="방명록을 남겨주세요"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <input
          className={styles.guestbook}
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className={styles.submit}
        >
          등록
        </button>
      </form>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        limit={1}
        hideProgressBar
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Slide}
      />
    </div>
  );
};

export default Guestbook;