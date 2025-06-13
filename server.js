// server.js

const express = require('express');
const next = require('next');
const fs = require('fs').promises;
const path = require('path');

require('dotenv').config();

const port = process.env.PORT || 3100;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  
  server.use(express.json());
  
  // Next.js 관련 정적 파일과 이미지 최적화 등의 경로를 먼저 처리
  server.use(express.static(path.join(__dirname, 'public')));
  server.all(/^\/_next\/.*/, (req, res) => handle(req, res));
  
  server.get('/api/data/:query', async (req, res) => {
    let { query } = req.params;

    console.log("request: " + query);

    if (query == "default") query = 'gy28sep2501';

    // 읽고자 하는 파일과 폴더 경로 설정
    const jsonFilePath = path.join(__dirname, 'data', 'data.json');
    const folderPath = path.join(__dirname, 'data', 'image', query, 'full');
    const headerPath = path.join(__dirname, 'data', 'image', query, 'header.jpg');

    try {
      // 두 작업을 동시에 실행
      const [jsonContent, fileList] = await Promise.all([
        fs.readFile(jsonFilePath, 'utf8'),
        fs.readdir(folderPath)
      ]);

      // JSON 파일 내용을 파싱
      const jsonData = JSON.parse(jsonContent)[query];
      const resultData = {};

      // person 배열 생성
      resultData.person = jsonData.person.map(p => ({
        name: p.name,
        color: p.color
      }));

      // relation 배열 생성
      resultData.relation = jsonData.person.map(p => ({
        // 각 person의 parent 배열에서 name 값을 추출합니다.
        parent: p.parent.map(parentObj => parentObj.name),
        title: p.order,
        name: p.name.kor.last + p.name.kor.first
      }));

      // content와 place는 그대로 복사
      resultData.content = jsonData.content;
      resultData.place = jsonData.place;

      // account 배열 생성
      resultData.account = jsonData.person.map(p => {
        const personalAccount = p.bank.kakao
          ? {
              title: p.title,
              name: p.name.kor.last + p.name.kor.first,
              bank: p.bank.name,
              account: p.bank.account,
              kakao: p.bank.kakao
            }
          : {
              title: p.title,
              name: p.name.kor.last + p.name.kor.first,
              bank: p.bank.name,
              account: p.bank.account
            };

        // 부모 계좌 정보 및 각 부모의 kakao 정보 추가 (flatMap을 통해 배열 평탄화)
        const parentAccounts = p.parent.flatMap(par => {
          const parentAccount = par.bank.kakao
            ? {
                title: par.title,
                name: par.name,
                bank: par.bank.name,
                account: par.bank.account,
                kakao: par.bank.kakao
              }
            : {
                title: par.title,
                name: par.name,
                bank: par.bank.name,
                account: par.bank.account
              };
          return [parentAccount];
        });

        return {
          color: p.color,
          content: [personalAccount, ...parentAccounts]
        };
      });

      resultData.galleryImage = {
        fullImages: fileList,
        thumbImages: fileList.map(fullImageName => "thumb_"+fullImageName)
      };

      const images = await Promise.all(
        resultData.galleryImage.thumbImages.map(async (fileName) => {
          const filePath = path.join(__dirname, 'data', 'image', query, 'thumb', fileName);
          const fileBuffer = await fs.readFile(filePath);
          return {
            fileName,
            content: fileBuffer.toString('base64')  // base64 변환
          };
        })
      );

      const fileBuffer = await fs.readFile(headerPath);
      const headerImage = fileBuffer.toString('base64');

      res.json({
        success: true,
        headerImage: headerImage,
        data: resultData,
        images: images
      });
    } catch (error) {
      console.error('데이터 처리 중 에러 발생:', error);
      // ENOENT 에러는 파일 혹은 폴더가 존재하지 않을 때 발생
      if (error.code === 'ENOENT') {
        res.status(404).json({
          success: false,
          error: '해당 JSON 파일이나 폴더를 찾을 수 없습니다.'
        });
      } else {
        res.status(500).json({
          success: false,
          error: '서버 내부 에러가 발생했습니다.'
        });
      }
    }
  });

  server.get('/api/image/:query/:image', (req, res) => {
    let { query, image } = req.params;
  
    console.log(`Received request: /api/image/${query}/${image}`);
    if (query === "default") query = 'gy28sep2501';
  
    const imagePath = path.join(__dirname, 'data', 'image', query, 'full', image);
  
    fs.access(imagePath, fs.constants.F_OK)
      .then(() => {
        console.log(`Image found: ${imagePath}`);
        res.sendFile(imagePath, (err) => {
          if (err) {
            console.error(`Error sending image file: ${err.message}`);
            res.status(500).end();
          } else {
            console.log(`Successfully sent image: ${image}`);
          }
        });
      })
      .catch((err) => {
        console.error(`Image not found: ${imagePath}`);
        res.status(404).json({ error: 'Image not found' });
      });
  });

  // 방명록 데이터 저장 API
  server.post('/api/guestbook/:query', async (req, res) => {
    let { query } = req.params;
    const { message, name } = req.body;

    console.log(`Received request: /api/guestbook/${query}`);
    console.log(`Name: ${name} / Message: ${message}`);
    if (query === "default") query = 'gy28sep2501';

    if (!message || !name) {
      return res.status(400).json({ success: false, error: "메시지와 이름을 입력해야 합니다." });
    }

    const guestbookFilePath = path.join(__dirname, 'data', 'guestbook.json');

    try {
      // 기존 JSON 파일 읽기
      let guestbookData = {};
      try {
        const fileContent = await fs.readFile(guestbookFilePath, 'utf8');
        guestbookData = JSON.parse(fileContent);
      } catch (error) {
        console.warn('새로운 guestbook.json 파일 생성 중');
      }

      // 새로운 데이터를 추가
      if (!guestbookData[query]) {
        guestbookData[query] = [];
      }
      guestbookData[query].push({ message, name });

      // 수정된 데이터를 파일에 저장
      await fs.writeFile(guestbookFilePath, JSON.stringify(guestbookData, null, 2));

      res.json({ success: true, message: "방명록 작성이 성공적으로 저장되었습니다." });
    } catch (error) {
      console.error('방명록 저장 중 에러 발생:', error);
      res.status(500).json({ success: false, error: '서버 내부 에러가 발생했습니다.' });
    }
  });
  
  server.all(/(.*)/, (req, res) => {
    if (!req.path.startsWith('/api')) {
      // 홈 페이지를 렌더링하도록 "/"로 처리
      return app.render(req, res, '/', req.query);
    }
    return handle(req, res);
  });
  
  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});