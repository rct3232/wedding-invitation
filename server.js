// server.js

const express = require('express');
const next = require('next');

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  
  // JSON 본문 파싱 미들웨어 (POST 요청 등의 경우)
  server.use(express.json());
  
  // API 예시 및 동적 라우트 설정
  server.get('/api/data/:query', async (req, res) => {
    try {
      const { query } = req.params;
      const data = {
        query,
        message: `쿼리 값 ${query} 에 해당하는 데이터입니다.`,
        date: new Date().toISOString()
      };
      res.json({ success: true, data });
    } catch (error) {
      console.error('데이터 로딩 에러:', error);
      res.status(500).json({ success: false, error: '서버 에러' });
    }
  });
  
  // 기타 모든 요청은 Next.js가 처리
  server.all('*', (req, res) => handle(req, res));
  
  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});