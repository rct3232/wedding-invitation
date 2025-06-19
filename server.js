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
  
  server.use(express.static(path.join(__dirname, 'public')));
  server.all(/^\/_next\/.*/, (req, res) => handle(req, res));
  
  server.get('/api/data/:query', async (req, res) => {
    let { query } = req.params;

    console.log("request: " + query);

    if (query == "default") query = 'gy28sep2501';

    const jsonFilePath = path.join(__dirname, 'data', 'data.json');
    const folderPath = path.join(__dirname, 'data', query, 'full');
    const headerPath = path.join(__dirname, 'data', query, 'header.jpg');

    try {
      const [jsonContent, fileList] = await Promise.all([
        fs.readFile(jsonFilePath, 'utf8'),
        fs.readdir(folderPath)
      ]);

      const jsonData = JSON.parse(jsonContent)[query];
      const resultData = {};

      resultData.person = jsonData.person.map(p => ({
        name: p.name,
        color: p.color
      }));

      resultData.relation = jsonData.person.map(p => ({
        parent: p.parent.map(parentObj => parentObj.name),
        title: p.order,
        name: p.name.kor.last + p.name.kor.first
      }));

      resultData.content = jsonData.content;
      resultData.place = jsonData.place;

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
          const filePath = path.join(__dirname, 'data', query, 'thumb', fileName);
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

  server.get('/api/bgm/:query', (req, res) => {
    let { query } = req.params;

    console.log(`Received request: /api/bgm/${query}`);
    if (query === 'default') query = 'gy28sep2501';

    const bgmPath = path.join(__dirname, 'data', query, 'bgm.mp3');
    fs.access(bgmPath)
      .then(() => {
        console.log("BGM found");

        res.setHeader('Content-Type', 'audio/mpeg');
        res.sendFile(bgmPath, (err) => {
          if (err) {
            console.error(`Error sending BGM file: ${err.message}`);
            res.status(500).end();
          } else {
            console.log("Successfully sent BGM");
          }
        });
      })
      .catch(() => res.status(404).send('BGM not found'));
  });

  server.get('/api/image/:query/:image', (req, res) => {
    let { query, image } = req.params;
  
    console.log(`Received request: /api/image/${query}/${image}`);
    if (query === "default") query = 'gy28sep2501';
  
    const imagePath = path.join(__dirname, 'data', query, 'full', image);
  
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

  server.post('/api/guestbook/write/:query', async (req, res) => {
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
      let guestbookData = {};
      try {
        const fileContent = await fs.readFile(guestbookFilePath, 'utf8');
        guestbookData = JSON.parse(fileContent);
      } catch (error) {
        console.warn('새로운 guestbook.json 파일 생성 중');
      }

      if (!guestbookData[query]) {
        guestbookData[query] = [];
      }
      guestbookData[query].push({ message, name });

      await fs.writeFile(guestbookFilePath, JSON.stringify(guestbookData, null, 2));

      res.json({ success: true, message: "방명록 작성이 성공적으로 저장되었습니다." });
    } catch (error) {
      console.error('방명록 저장 중 에러 발생:', error);
      res.status(500).json({ success: false, error: '서버 내부 에러가 발생했습니다.' });
    }
  });

  server.get('/api/guestbook/read/:query', async (req, res) => {
    let { query } = req.params;
    if (query === 'default') query = 'gy28sep2501';

    const guestbookFilePath = path.join(__dirname, 'data', 'guestbook.json');

    try {
      const fileContent = await fs.readFile(guestbookFilePath, 'utf8');
      const guestbookData = JSON.parse(fileContent);
      const entries = guestbookData[query] || [];
      res.json({ success: true, entries });
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.json({ success: true, entries: [] });
      } else {
        console.error('GET /api/guestbook 에러', err);
        res.status(500).json({ success: false, error: '서버 내부 에러가 발생했습니다.' });
      }
    }
  });
  
  server.all(/(.*)/, (req, res) => {
    if (!req.path.startsWith('/api')) {
      return app.render(req, res, '/', req.query);
    }
    return handle(req, res);
  });
  
  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});