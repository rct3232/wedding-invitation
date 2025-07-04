const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const promClient = require('prom-client');

module.exports = function(register) { // register is passed in
  const router = express.Router();

  const reqLogger = (req, msg, err) => {
    const timestamp   = new Date().toISOString();
    const clientIp    = req.headers['x-forwarded-for']
                     || req.ip
                     || req.connection.remoteAddress;
    
    let consoleMsg = `[${timestamp}] [${clientIp}]}  ${req.method} ${req.originalUrl}`;
    if (!msg) console.log(consoleMsg);
    else {
      consoleMsg += ` ${msg}`
      if(!err) console.log(consoleMsg)
      else console.error(consoleMsg, err);
    }    
  };

  router.use((req, res, next) => {
    reqLogger(req);
    next();
  });

  // Define Custom Metrics
  const apiRequestsTotal = new promClient.Counter({
    name: 'api_requests_total',
    help: 'Total number of API requests',
    labelNames: ['route', 'method', 'status_code', 'query_param'],
  });

  const apiRequestDurationSeconds = new promClient.Histogram({
    name: 'api_request_duration_seconds',
    help: 'Duration of API requests in seconds',
    labelNames: ['route', 'method', 'query_param'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], // Adjusted buckets
  });

  // Register custom metrics if they aren't already registered (idempotent)
  if (!register.getSingleMetric('api_requests_total')) {
    register.registerMetric(apiRequestsTotal);
  }
  if (!register.getSingleMetric('api_request_duration_seconds')) {
    register.registerMetric(apiRequestDurationSeconds);
  }

  // Data route
  router.get('/data/:query', async (req, res) => {
    const route = '/data';
    const method = 'GET';
    let { query } = req.params;
    const queryLabel = query === "default" ? 'gy28sep2501' : query;
    const end = apiRequestDurationSeconds.startTimer({ route, method, query_param: queryLabel });
    let statusCode = 200;

    if (query == "default") query = 'gy28sep2501';

    const jsonFilePath = path.join(__dirname, '..', 'data', 'data.json');
    const folderPath = path.join(__dirname, '..', 'data', query, 'full');
    const headerPath = path.join(__dirname, '..', 'data', query, 'header.jpg');

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
          if (!par.bank) return [];

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
          const filePath = path.join(__dirname, '..', 'data', query, 'thumb', fileName);
          const fileBuffer = await fs.readFile(filePath);
          return {
            fileName,
            content: fileBuffer.toString('base64')
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
      reqLogger(req, 'Error occur during data process', error);
      if (error.code === 'ENOENT') {
        statusCode = 404;
        res.status(404).json({
          success: false,
          error: '해당 JSON 파일이나 폴더를 찾을 수 없습니다.'
        });
      } else {
        statusCode = 500;
        res.status(500).json({
          success: false,
          error: '서버 내부 에러가 발생했습니다.'
        });
      }
    } finally {
      end();
      apiRequestsTotal.labels(route, method, statusCode, queryLabel).inc();
    }
  });

  // BGM route
  router.get('/bgm/:query', (req, res) => {
    const route = '/bgm';
    const method = 'GET';
    let { query } = req.params;
    const queryLabel = query === "default" ? 'gy28sep2501' : query;
    const end = apiRequestDurationSeconds.startTimer({ route, method, query_param: queryLabel });
    let statusCode = 200;

    if (query === 'default') query = 'gy28sep2501';

    const bgmPath = path.join(__dirname, '..', 'data', query, 'bgm.mp3');
    fs.access(bgmPath)
      .then(() => {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.sendFile(bgmPath, (err) => {
          if (err) {
            statusCode = 500;
            reqLogger(req, 'Error sending BGM file', err.message);
          }
          end();
          apiRequestsTotal.labels(route, method, statusCode, queryLabel).inc();
        });
      })
      .catch(() => {
        statusCode = 404;
        res.status(404).send('BGM not found');
        end();
        apiRequestsTotal.labels(route, method, statusCode, queryLabel).inc();
      });
  });

  // Image route
  router.get('/image/:query/:image', (req, res) => {
    const route = '/image';
    const method = 'GET';
    let { query, image } = req.params;
    const queryLabel = query === "default" ? 'gy28sep2501' : query;
    const end = apiRequestDurationSeconds.startTimer({ route, method, query_param: queryLabel });
    let statusCode = 200;

    if (query === "default") query = 'gy28sep2501';

    const imagePath = path.join(__dirname, '..', 'data', query, 'full', image);
    fs.access(imagePath, fs.constants.F_OK)
      .then(() => {
        res.sendFile(imagePath, (err) => {
          if (err) {
            statusCode = 500;
            reqLogger(req, 'Error sending image file', err.message);
          }
          end();
          apiRequestsTotal.labels(route, method, statusCode, queryLabel).inc();
        });
      })
      .catch((err) => {
        statusCode = 404;
        reqLogger(req, `Error Image not found: ${imagePath}`);
        res.status(404).json({ error: 'Image not found' });
        end();
        apiRequestsTotal.labels(route, method, statusCode, queryLabel).inc();
      });
  });

  // Guestbook write route
  router.post('/guestbook/write/:query', async (req, res) => {
    const route = '/guestbook/write';
    const method = 'POST';
    let { query } = req.params;
    const queryLabel = query === "default" ? 'gy28sep2501' : query;
    const end = apiRequestDurationSeconds.startTimer({ route, method, query_param: queryLabel });
    let statusCode = 200;

    const { message, name } = req.body;
    reqLogger(req, `Name: ${name} / Message: ${message}`);
    if (query === "default") query = 'gy28sep2501';

    if (!message || !name) {
      statusCode = 400;
      reqLogger(req, 'Error Missing Name or Message');
      end();
      apiRequestsTotal.labels(route, method, statusCode, queryLabel).inc();
      return res.status(400).json({ success: false, error: "메시지와 이름을 입력해야 합니다." });
    }

    const guestbookFilePath = path.join(__dirname, '..', 'data', 'guestbook.json');
    try {
      let guestbookData = {};
      try {
        const fileContent = await fs.readFile(guestbookFilePath, 'utf8');
        guestbookData = JSON.parse(fileContent);
      } catch (error) {
        reqLogger(req, 'Make new guestbook.json');
      }

      if (!guestbookData[query]) {
        guestbookData[query] = [];
      }
      guestbookData[query].push({ message, name });

      await fs.writeFile(guestbookFilePath, JSON.stringify(guestbookData, null, 2));
      res.json({ success: true, message: "방명록 작성이 성공적으로 저장되었습니다." });
    } catch (error) {
      statusCode = 500;
      reqLogger(req, 'Error occur during guestbook write', error);
      res.status(500).json({ success: false, error: '서버 내부 에러가 발생했습니다.' });
    } finally {
      end();
      apiRequestsTotal.labels(route, method, statusCode, queryLabel).inc();
    }
  });

  // Guestbook read route
  router.get('/guestbook/read/:query', async (req, res) => {
    const route = '/guestbook/read';
    const method = 'GET';
    let { query } = req.params;
    const queryLabel = query === "default" ? 'gy28sep2501' : query;
    const end = apiRequestDurationSeconds.startTimer({ route, method, query_param: queryLabel });
    let statusCode = 200;

    if (query === 'default') query = 'gy28sep2501';

    const guestbookFilePath = path.join(__dirname, '..', 'data', 'guestbook.json');
    try {
      const fileContent = await fs.readFile(guestbookFilePath, 'utf8');
      const guestbookData = JSON.parse(fileContent);
      const entries = guestbookData[query] || [];
      res.json({ success: true, entries });
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.json({ success: true, entries: [] });
      } else {
        statusCode = 500;
        reqLogger(req, 'Error occur during guestbook read', err);
        res.status(500).json({ success: false, error: '서버 내부 에러가 발생했습니다.' });
      }
    } finally {
      end();
      apiRequestsTotal.labels(route, method, statusCode, queryLabel).inc();
    }
  });

  return router;
};
