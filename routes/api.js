const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const promClient = require('prom-client');
const multer = require('multer');
const fsSync = require('fs');
const { reqLogger, cleanupArtifacts, getDataPath, createMetricsWrapper } = require('./apiUtils');
const { getInvitationData, addGuestbookEntry, getGuestbookEntries, getNextUploadIndex, addUploadHash, checkDuplicateHashes } = require('./db');

module.exports = function(register) {
  const router = express.Router();

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

  const withMetrics = createMetricsWrapper(apiRequestDurationSeconds, apiRequestsTotal);

  router.get('/data/:query', withMetrics('/data', 'GET', async (req, res) => {
    const { query } = req.params;
    try {
      const invitationData = getInvitationData(query);
      if (!invitationData) {
        return res.status(404).json({ success: false, error: '해당 초대 데이터를 찾을 수 없습니다.' });
      }

      const folderPath = getDataPath(query, 'full');
      const headerPath = getDataPath(query, 'header.jpg');
      const [fileList] = await Promise.all([
        fs.readdir(folderPath)
      ]);

  const resultData = {};
  resultData.person = invitationData.person.map(p => ({ name: p.name, color: p.color }));
  resultData.relation = invitationData.person.map(p => ({
        parent: p.parent.map(parentObj => parentObj.name),
        title: p.order,
        name: p.name.kor.last + p.name.kor.first
      }));
  resultData.content = invitationData.content;
  resultData.place = invitationData.place;
  resultData.account = invitationData.person.map(p => {
        const baseInfo = {
          title: p.title,
          name: p.name.kor.last + p.name.kor.first,
          bank: p.bank.name,
          account: p.bank.account
        };
        const personalAccount = p.bank.kakao ? { ...baseInfo, kakao: p.bank.kakao } : baseInfo;
        const parentAccounts = p.parent.flatMap(par => {
          if (!par.bank) return [];
          const parentBase = { title: par.title, name: par.name, bank: par.bank.name, account: par.bank.account };
            return [par.bank.kakao ? { ...parentBase, kakao: par.bank.kakao } : parentBase];
        });
        return { color: p.color, content: [personalAccount, ...parentAccounts] };
      });
      resultData.galleryImage = { fullImages: fileList, thumbImages: fileList.map(n => 'thumb_' + n) };

      const images = await Promise.all(
        resultData.galleryImage.thumbImages.map(async (fileName) => {
          const filePath = getDataPath(query, 'thumb', fileName);
          const fileBuffer = await fs.readFile(filePath);
          return { fileName, content: fileBuffer.toString('base64') };
        })
      );
      const headerImage = (await fs.readFile(headerPath)).toString('base64');
      res.json({ success: true, headerImage, data: resultData, images });
    } catch (error) {
      reqLogger(req, 'Error during invitation data process', error);
      if (error.code === 'ENOENT') {
        return res.status(404).json({ success: false, error: '관련 리소스를 찾을 수 없습니다.' });
      }
      res.status(500).json({ success: false, error: '서버 내부 에러가 발생했습니다.' });
    }
  }));

  router.get('/bgm/:query', withMetrics('/bgm', 'GET', (req, res) => {
    const { query } = req.params;
    const bgmPath = getDataPath(query, 'bgm.mp3');
    fs.access(bgmPath)
      .then(() => {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.sendFile(bgmPath, (err) => {
          if (err) reqLogger(req, 'Error sending BGM file', err.message);
        });
      })
      .catch(() => {
        res.status(404).send('BGM not found');
      });
  }));

  router.get('/image/:query/:image', withMetrics('/image', 'GET', (req, res) => {
    const { query, image } = req.params;
    const imagePath = getDataPath(query, 'full', image);
    fs.access(imagePath)
      .then(() => {
        res.sendFile(imagePath, (err) => {
          if (err) reqLogger(req, 'Error sending image file', err.message);
        });
      })
      .catch(() => {
        reqLogger(req, `Error Image not found: ${imagePath}`);
        res.status(404).json({ error: 'Image not found' });
      });
  }));

  router.post('/guestbook/write/:query', withMetrics('/guestbook/write', 'POST', async (req, res) => {
    const { query } = req.params;
    const { message, name } = req.body || {};
    reqLogger(req, `Name: ${name} / Message: ${message}`);
    if (!message || !name) {
      return res.status(400).json({ success: false, error: '메시지와 이름을 입력해야 합니다.' });
    }
    try {
      addGuestbookEntry(query, name, message);
      res.json({ success: true, message: '방명록 작성이 성공적으로 저장되었습니다.' });
    } catch (error) {
      reqLogger(req, 'Error occur during guestbook write', error);
      res.status(500).json({ success: false, error: '서버 내부 에러가 발생했습니다.' });
    }
  }));

  router.get('/guestbook/read/:query', withMetrics('/guestbook/read', 'GET', async (req, res) => {
    const { query } = req.params;
    try {
      const entries = getGuestbookEntries(query);
      res.json({ success: true, entries });
    } catch (err) {
      reqLogger(req, 'Error occur during guestbook read', err);
      res.status(500).json({ success: false, error: '서버 내부 에러가 발생했습니다.' });
    }
  }));

  router.post('/photo-upload-chunk/:query', withMetrics('/photo-upload-chunk', 'POST', (req, res) => {
    const { query } = req.params;
    const memoryUpload = multer({ storage: multer.memoryStorage() }).single('chunk');
    memoryUpload(req, res, async (err) => {
      if (err) {
        reqLogger(req, 'Error receiving chunk', err);
        return res.status(500).json({ message: '업로드에 실패했습니다.' });
      }
      let finalPath;
      try {
        if (!query) return res.status(400).json({ message: '잘못된 접근입니다.' });
        const { fileId, chunkIndex, totalChunks, originalName, hash } = req.body || {};
        if (!req.file || !fileId || chunkIndex === undefined || !totalChunks || !hash) {
          return res.status(400).json({ message: '필수 파라미터가 누락되었습니다.' });
        }
        const idx = parseInt(chunkIndex, 10);
        const total = parseInt(totalChunks, 10);
        if (Number.isNaN(idx) || Number.isNaN(total) || total <= 0) {
          return res.status(400).json({ message: '청크 인덱스가 올바르지 않습니다.' });
        }
        const baseDir = getDataPath(query);
        const tmpDir = path.join(baseDir, 'uploads_tmp');
        const uploadDir = path.join(baseDir, 'uploads');
        if (!fsSync.existsSync(tmpDir)) fsSync.mkdirSync(tmpDir, { recursive: true });
        if (!fsSync.existsSync(uploadDir)) fsSync.mkdirSync(uploadDir, { recursive: true });
        const partPath = path.join(tmpDir, `${fileId}.${idx}.part`);
        await fs.writeFile(partPath, req.file.buffer);
        if (idx < total - 1) return res.status(200).json({ received: true, chunkIndex: idx, totalChunks: total });
        for (let i = 0; i < total; i++) {
          const p = path.join(tmpDir, `${fileId}.${i}.part`);
          if (!fsSync.existsSync(p)) {
            reqLogger(req, `Missing part file: ${p}`);
            await cleanupArtifacts(fileId, tmpDir, undefined);
            return res.status(400).json({ message: '누락된 청크가 있습니다.' });
          }
        }
  const nextIndex = getNextUploadIndex(query);
  const finalName = `${nextIndex}.jpg`;
        finalPath = path.join(uploadDir, finalName);
        for (let i = 0; i < total; i++) {
          const p = path.join(tmpDir, `${fileId}.${i}.part`);
          const buf = await fs.readFile(p);
          fsSync.appendFileSync(finalPath, buf);
        }
        for (let i = 0; i < total; i++) {
          const p = path.join(tmpDir, `${fileId}.${i}.part`);
          try { await fs.unlink(p); } catch {}
        }
  addUploadHash(query, finalName, hash);
        res.status(200).json({ done: true, id: finalName, originalName: originalName || null });
      } catch (e) {
        reqLogger(req, 'Error processing chunked upload', e);
        try {
          const { fileId } = req.body || {};
          const baseDir = getDataPath(req.params.query || '');
          const tmpDir = path.join(baseDir, 'uploads_tmp');
          await cleanupArtifacts(fileId, tmpDir, finalPath);
        } catch {}
        res.status(500).json({ message: '업로드에 실패했습니다.' });
      }
    });
  }));

  router.post('/photo-hash-check/:query', withMetrics('/photo-hash-check', 'POST', async (req, res) => {
    const { query } = req.params;
    try {
      if (!query) return res.status(400).json({ message: '잘못된 접근입니다.' });
      const { hashes } = req.body || {};
      if (!Array.isArray(hashes)) return res.status(400).json({ message: '서버 내부 에러가 발생했습니다.' });
  const duplicates = checkDuplicateHashes(query, hashes);
  res.status(200).json({ duplicates });
    } catch (err) {
      reqLogger(req, 'Error checking photo hashes', err);
      res.status(500).json({ message: '서버 내부 에러가 발생했습니다.' });
    }
  }));

  return router;
};
