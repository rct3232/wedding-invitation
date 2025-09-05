const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const promClient = require('prom-client');
const multer = require("multer");
const fsSync = require("fs");

module.exports = function(register) {
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

  const apiRequestsTotal = new promClient.Counter({
    name: 'api_requests_total',
    help: 'Total number of API requests',
    labelNames: ['route', 'method', 'status_code', 'query_param'],
  });

  const apiRequestDurationSeconds = new promClient.Histogram({
    name: 'api_request_duration_seconds',
    help: 'Duration of API requests in seconds',
    labelNames: ['route', 'method', 'query_param'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  });

  if (!register.getSingleMetric('api_requests_total')) {
    register.registerMetric(apiRequestsTotal);
  }
  if (!register.getSingleMetric('api_request_duration_seconds')) {
    register.registerMetric(apiRequestDurationSeconds);
  }

  // Helper: cleanup partial artifacts created by chunked uploads
  const cleanupArtifacts = async (fileId, tmpDir, finalPath) => {
    if (!fileId || !tmpDir) return;
    try {
      const files = await fs.readdir(tmpDir);
      await Promise.all(
        files
          .filter((name) => name.startsWith(`${fileId}.`) && name.endsWith('.part'))
          .map((name) => fs.unlink(path.join(tmpDir, name)).catch(() => {}))
      );
      if (finalPath && fsSync.existsSync(finalPath)) {
        await fs.unlink(finalPath).catch(() => {});
      }
    } catch {
      // ignore cleanup errors
    }
  };

  router.get('/data/:query', async (req, res) => {
    const route = '/data';
    const method = 'GET';
    let { query } = req.params;
    const end = apiRequestDurationSeconds.startTimer({ route, method, query_param: query });
    let statusCode = 200;

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
      apiRequestsTotal.labels(route, method, statusCode, query).inc();
    }
  });

  router.get('/bgm/:query', (req, res) => {
    const route = '/bgm';
    const method = 'GET';
    let { query } = req.params;
    const end = apiRequestDurationSeconds.startTimer({ route, method, query_param: query });
    let statusCode = 200;

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
          apiRequestsTotal.labels(route, method, statusCode, query).inc();
        });
      })
      .catch(() => {
        statusCode = 404;
        res.status(404).send('BGM not found');
        end();
        apiRequestsTotal.labels(route, method, statusCode, query).inc();
      });
  });

  router.get('/image/:query/:image', (req, res) => {
    const route = '/image';
    const method = 'GET';
    let { query, image } = req.params;
    const end = apiRequestDurationSeconds.startTimer({ route, method, query_param: query });
    let statusCode = 200;

    const imagePath = path.join(__dirname, '..', 'data', query, 'full', image);
    fs.access(imagePath)
      .then(() => {
        res.sendFile(imagePath, (err) => {
          if (err) {
            statusCode = 500;
            reqLogger(req, 'Error sending image file', err.message);
          }
          end();
          apiRequestsTotal.labels(route, method, statusCode, query).inc();
        });
      })
      .catch(() => {
        statusCode = 404;
        reqLogger(req, `Error Image not found: ${imagePath}`);
        res.status(404).json({ error: 'Image not found' });
        end();
        apiRequestsTotal.labels(route, method, statusCode, query).inc();
      });
  });

  router.post('/guestbook/write/:query', async (req, res) => {
    const route = '/guestbook/write';
    const method = 'POST';
    let { query } = req.params;
    const end = apiRequestDurationSeconds.startTimer({ route, method, query_param: query });
    let statusCode = 200;

    const { message, name } = req.body;
    reqLogger(req, `Name: ${name} / Message: ${message}`);

    if (!message || !name) {
      statusCode = 400;
      reqLogger(req, 'Error Missing Name or Message');
      end();
      apiRequestsTotal.labels(route, method, statusCode, query).inc();
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
      apiRequestsTotal.labels(route, method, statusCode, query).inc();
    }
  });

  router.get('/guestbook/read/:query', async (req, res) => {
    const route = '/guestbook/read';
    const method = 'GET';
    let { query } = req.params;
    const end = apiRequestDurationSeconds.startTimer({ route, method, query_param: query });
    let statusCode = 200;

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
      apiRequestsTotal.labels(route, method, statusCode, query).inc();
    }
  });

  // New: Chunked upload endpoint per photo
  router.post("/photo-upload-chunk/:query", (req, res) => {
    const route = '/photo-upload-chunk';
    const method = 'POST';
    const { query } = req.params;
    const end = apiRequestDurationSeconds.startTimer({ route, method, query_param: query });
    let statusCode = 200;

    const memoryUpload = multer({ storage: multer.memoryStorage() }).single("chunk");

    memoryUpload(req, res, async (err) => {
      if (err) {
        statusCode = 500;
        reqLogger(req, 'Error receiving chunk', err);
        end();
        apiRequestsTotal.labels(route, method, statusCode, query || '').inc();
        return res.status(500).json({ message: "업로드에 실패했습니다." });
      }

      let finalPath; // will be set if we reached assembly stage

      try {
        if (!query) {
          statusCode = 400;
          end();
          apiRequestsTotal.labels(route, method, statusCode, query || '').inc();
          return res.status(400).json({ message: "잘못된 접근입니다." });
        }

        const { fileId, chunkIndex, totalChunks, originalName, hash } = req.body || {};
        if (!req.file || !fileId || chunkIndex === undefined || !totalChunks || !hash) {
          statusCode = 400;
          end();
          apiRequestsTotal.labels(route, method, statusCode, query || '').inc();
          return res.status(400).json({ message: "필수 파라미터가 누락되었습니다." });
        }

        const idx = parseInt(chunkIndex, 10);
        const total = parseInt(totalChunks, 10);
        if (Number.isNaN(idx) || Number.isNaN(total) || total <= 0) {
          statusCode = 400;
          end();
          apiRequestsTotal.labels(route, method, statusCode, query || '').inc();
          return res.status(400).json({ message: "청크 인덱스가 올바르지 않습니다." });
        }

        const baseDir = path.join(__dirname, "../data/", query);
        const tmpDir = path.join(baseDir, "uploads_tmp");
        const uploadDir = path.join(baseDir, "uploads");
        if (!fsSync.existsSync(tmpDir)) fsSync.mkdirSync(tmpDir, { recursive: true });
        if (!fsSync.existsSync(uploadDir)) fsSync.mkdirSync(uploadDir, { recursive: true });

        // Save this chunk as a part file
        const partPath = path.join(tmpDir, `${fileId}.${idx}.part`);
        await fs.writeFile(partPath, req.file.buffer);

        // If this is not the last chunk, return early with progress ack
        if (idx < total - 1) {
          res.status(200).json({ received: true, chunkIndex: idx, totalChunks: total });
          end();
          apiRequestsTotal.labels(route, method, statusCode, query || '').inc();
          return;
        }

        // Last chunk received: assemble all parts in order
        // Verify all parts exist
        for (let i = 0; i < total; i++) {
          const p = path.join(tmpDir, `${fileId}.${i}.part`);
          if (!fsSync.existsSync(p)) {
            statusCode = 400;
            reqLogger(req, `Missing part file: ${p}`);
            // Cleanup all partial parts for this fileId
            await cleanupArtifacts(fileId, tmpDir, undefined);
            end();
            apiRequestsTotal.labels(route, method, statusCode, query || '').inc();
            return res.status(400).json({ message: "누락된 청크가 있습니다." });
          }
        }

        // Load or init uploadhash.json
        const hashFilePath = path.join(__dirname, "../data/uploadhash.json");
        let uploadHash = {};
        try {
          const content = await fs.readFile(hashFilePath, "utf8");
          uploadHash = JSON.parse(content);
        } catch (e) {
          if (e.code !== "ENOENT") {
            statusCode = 500;
            reqLogger(req, "Error reading uploadhash.json", e);
            // cleanup parts on fatal error
            await cleanupArtifacts(fileId, tmpDir, undefined);
            end();
            apiRequestsTotal.labels(route, method, statusCode, query || '').inc();
            return res.status(500).json({ message: "서버 내부 에러가 발생했습니다." });
          }
        }
        if (!uploadHash[query]) uploadHash[query] = {};

        // Create next file name
        const nextIndex = Object.keys(uploadHash[query]).length + 1;
        const finalName = `${nextIndex}.jpg`;
        finalPath = path.join(uploadDir, finalName);

        // Assemble parts into final file
        for (let i = 0; i < total; i++) {
          const p = path.join(tmpDir, `${fileId}.${i}.part`);
          const buf = await fs.readFile(p);
          fsSync.appendFileSync(finalPath, buf);
        }

        // Cleanup parts
        for (let i = 0; i < total; i++) {
          const p = path.join(tmpDir, `${fileId}.${i}.part`);
          try { await fs.unlink(p); } catch {}
        }

        // Save hash mapping
        uploadHash[query][finalName] = hash;
        await fs.writeFile(hashFilePath, JSON.stringify(uploadHash, null, 2));

        res.status(200).json({ done: true, id: finalName, originalName: originalName || null });
      } catch (e) {
        statusCode = 500;
        reqLogger(req, 'Error processing chunked upload', e);
        // Best-effort cleanup of partial chunks and partially assembled file
        try {
          const { fileId } = req.body || {};
          const baseDir = path.join(__dirname, "../data/", req.params.query || "");
          const tmpDir = path.join(baseDir, "uploads_tmp");
          await cleanupArtifacts(fileId, tmpDir, finalPath);
        } catch {}
        res.status(500).json({ message: "업로드에 실패했습니다." });
      } finally {
        end();
        apiRequestsTotal.labels(route, method, statusCode, query || '').inc();
      }
    });
  });

  router.post("/photo-hash-check/:query", async (req, res) => {
    const route = '/photo-hash-check';
    const method = 'POST';
    const { query } = req.params;
    const end = apiRequestDurationSeconds.startTimer({ route, method, query_param: query });
    let statusCode = 200;

    try {
      if (!query) {
        statusCode = 400;
        return res.status(400).json({ message: "잘못된 접근입니다." });
      }

      const { hashes } = req.body || {};
      if (!Array.isArray(hashes)) {
        statusCode = 400;
        return res.status(400).json({ message: "서버 내부 에러가 발생했습니다." });
      }

      const hashFilePath = path.join(__dirname, "../data/uploadhash.json");
      let uploadHash = {};
      try {
        const content = await fs.readFile(hashFilePath, "utf8");
        uploadHash = JSON.parse(content);
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
      }

      const existing = new Set(Object.values(uploadHash[query] || {}));
      const duplicates = hashes.filter(h => existing.has(h));
      res.status(200).json({ duplicates });
    } catch (err) {
      statusCode = 500;
      reqLogger(req, 'Error checking photo hashes', err);
      res.status(500).json({ message: "서버 내부 에러가 발생했습니다." });
    } finally {
      end();
      apiRequestsTotal.labels('/photo-hash-check', 'POST', statusCode, req.params.query || '').inc();
    }
  });

  return router;
};
