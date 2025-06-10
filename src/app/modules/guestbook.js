"use client"

import React, { useState } from 'react';
import styles from './guestbook.module.css'; // 스타일 모듈 임포트

const Guestbook = ({ urlPath }) => {
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); // 폼 제출 시 페이지 리로드 방지
    
    // 전송할 데이터 구성
    const data = { message, name };

    try {
      // POST 요청으로 입력한 내용을 express 서버로 전송합니다.
      const response = await fetch('/'+urlPath+'/guestbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // 전송 성공 시 입력 필드 초기화
        setMessage('');
        setName('');
        console.log('방명록 작성이 성공적으로 전송되었습니다.');
      } else {
        console.error('방명록 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('전송 중 에러 발생: ', error);
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
    </div>
  );
};

export default Guestbook;