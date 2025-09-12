const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const promClient = require('prom-client');
const multer = require('multer');
const fsSync = require('fs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { reqLogger, cleanupArtifacts, getDataPath, createMetricsWrapper } = require('./apiUtils');
const { 
  getInvitationData, addGuestbookEntry, getGuestbookEntries, 
  getNextUploadIndex, addUploadHash, checkDuplicateHashes,
  listInvitations, countGuestbook, deleteUploadByFileName,
  upsertInvitationData,
  listUploads
} = require('./db');
const sharp = require('sharp');
const archiver = require('archiver');

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
      const invitationData = await getInvitationData(query);
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
      await addGuestbookEntry(query, name, message);
      res.json({ success: true, message: '방명록 작성이 성공적으로 저장되었습니다.' });
    } catch (error) {
      reqLogger(req, 'Error occur during guestbook write', error);
      res.status(500).json({ success: false, error: '서버 내부 에러가 발생했습니다.' });
    }
  }));

  router.get('/guestbook/read/:query', withMetrics('/guestbook/read', 'GET', async (req, res) => {
    const { query } = req.params;
    try {
      const entries = await getGuestbookEntries(query);
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
        const nextIndex = await getNextUploadIndex(query);
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
        await addUploadHash(query, finalName, hash);
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
      const duplicates = await checkDuplicateHashes(query, hashes);
      res.status(200).json({ duplicates });
    } catch (err) {
      reqLogger(req, 'Error checking photo hashes', err);
      res.status(500).json({ message: '서버 내부 에러가 발생했습니다.' });
    }
  }));

  // ----- Admin helpers (moved from server.js) -----
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false
  });
  const getCsrf = (req) => {
    if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
    return req.session.csrf;
  };
  const safeReadDir = async (dirPath) => {
    try {
      const files = await fs.readdir(dirPath);
      return files.filter(f => /^[\w.\-]+$/.test(f));
    } catch {
      return [];
    }
  };
  const safePathJoin = (base, ...segments) => {
    const p = path.normalize(path.join(base, ...segments));
    if (!p.startsWith(base)) throw new Error('Invalid path');
    return p;
  };

  // ----- Admin JSON APIs (moved) -----
  router.get('/admin/csrf', withMetrics('/admin/csrf', 'GET', (req, res) => {
    const token = getCsrf(req);
    req.session.save(() => {
      res.set('Cache-Control', 'no-store');
      res.json({ csrf: token });
    });
  }));

  router.post('/admin/login', withMetrics('/admin/login', 'POST', (req, res) => loginLimiter(req, res, () => {
    const token = req.headers['x-csrf-token'];
    const { id, pw } = req.body || {};
    if (token !== req.session.csrf) {
      reqLogger(req, 'CSRF token mismatch', { received: token, expected: req.session.csrf });
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const ok = id === process.env.ADMIN_ID && pw === process.env.ADMIN_PW;
    if (!ok) return res.status(401).json({ success: false, error: 'Unauthorized' });
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ success: false });
      req.session.isAdmin = true;
      req.session.csrf = crypto.randomBytes(24).toString('hex');
      res.json({ success: true });
    });
  })));

  router.post('/admin/logout', withMetrics('/admin/logout', 'POST', (req, res) => {
    if (!req.session || !req.session.isAdmin) return res.status(401).json({ success: false });
    const token = req.headers['x-csrf-token'];
    if (token !== req.session.csrf) return res.status(403).json({ success: false, error: 'Forbidden' });
    req.session.destroy(() => res.json({ success: true }));
  }));

  router.get('/admin/summary', withMetrics('/admin/summary', 'GET', async (req, res) => {
    if (!req.session || !req.session.isAdmin) return res.status(401).json({ success: false });
    const ids = await listInvitations();
    const payload = [];
    for (const id of ids) {
      const baseDir = getDataPath(id);
      const full = await safeReadDir(path.join(baseDir, 'full'));
      // Load uploads filenames from DB instead of filesystem
      const uploads = await listUploads(id);
      const guestCnt = await countGuestbook(id);
      payload.push({ id, guestCnt, full, uploads });
    }
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, items: payload });
  }));

  router.get('/admin/uploads/:id/:name', withMetrics('/admin/uploads', 'GET', (req, res) => {
    if (!req.session || !req.session.isAdmin) return res.status(401).send('Unauthorized');
    const { id, name } = req.params;
    if (!/^[\w.\-]+$/.test(id) || !/^[\w.\-]+$/.test(name)) return res.status(400).send('Bad request');
    try {
      const base = getDataPath(id);
      const filePath = safePathJoin(base, 'uploads', name);
      res.sendFile(filePath, (err) => {
        if (err) res.status(err.statusCode || 404).send('Not found');
      });
    } catch {
      res.status(400).send('Bad request');
    }
  }));

  // New: ZIP selected upload files and download once
  router.post('/admin/uploads-zip', withMetrics('/admin/uploads-zip', 'POST', async (req, res) => {
    if (!req.session || !req.session.isAdmin) return res.status(401).send('Unauthorized');
    const token = req.headers['x-csrf-token'];
    if (token !== req.session.csrf) return res.status(403).send('Forbidden');

    const { id, names } = req.body || {};
    if (!id || !/^[\w.\-]+$/.test(id)) return res.status(400).send('Bad request');
    if (!Array.isArray(names) || names.length === 0) return res.status(400).send('No files');

    try {
      const base = getDataPath(id);
      const fileNames = names.filter(n => /^[\w.\-]+$/.test(n));

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="uploads_${id}_${Date.now()}.zip"`
      );

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', (err) => {
        reqLogger(req, 'archiver error', err);
        try { res.status(500).end(); } catch {}
      });
      archive.pipe(res);

      for (const name of fileNames) {
        try {
          const filePath = safePathJoin(base, 'uploads', name);
          if (fsSync.existsSync(filePath)) {
            archive.file(filePath, { name });
          }
        } catch {
          // skip invalid/missing
        }
      }

      await archive.finalize();
    } catch (e) {
      reqLogger(req, 'Error building uploads zip', e);
      res.status(500).send('Internal error');
    }
  }));

  router.post('/admin/delete-file', withMetrics('/admin/delete-file', 'POST', async (req, res) => {
    if (!req.session || !req.session.isAdmin) return res.status(401).json({ success: false });
    try {
      const token = req.headers['x-csrf-token'];
      const { id, type, name } = req.body || {};
      if (token !== req.session.csrf) return res.status(403).json({ success: false, error: 'Forbidden' });
      if (!/^(full|uploads)$/.test(type)) return res.status(400).json({ success: false });
      if (!/^[\w.\-]+$/.test(id) || !/^[\w.\-]+$/.test(name)) return res.status(400).json({ success: false });
      const base = getDataPath(id);
      const filePath = safePathJoin(base, type, name);
      await fs.unlink(filePath).catch(() => {});
      if (type === 'uploads') {
        await deleteUploadByFileName(id, name);
      } else if (type === 'full') {
        // Also remove the corresponding thumbnail: thumb/thumb_{name}
        const thumbPath = safePathJoin(base, 'thumb', `thumb_${name}`);
        await fs.unlink(thumbPath).catch(() => {});
      }
      return res.json({ success: true });
    } catch {
      return res.status(400).json({ success: false });
    }
  }));

  // Load raw invitation_data for admin editor
  router.get('/admin/invitation-data', withMetrics('/admin/invitation-data', 'GET', async (req, res) => {
    if (!req.session || !req.session.isAdmin) return res.status(401).json({ success: false });
    const { id } = req.query || {};
    if (!id || !/^[\w.\-]+$/.test(id)) return res.status(400).json({ success: false, error: 'Bad request' });

    try {
      const data = await getInvitationData(id);
      if (!data) {
        return res.status(404).json({ success: false, error: '데이터를 찾을 수 없습니다.' });
      }
      res.set('Cache-Control', 'no-store');
      res.json(data);
    } catch (err) {
      reqLogger(req, 'Error loading admin invitation-data', err);
      res.status(500).json({ success: false, error: '서버 내부 에러가 발생했습니다.' });
    }
  }));

  // Save invitation_data from admin editor
  router.put('/admin/invitation-data', withMetrics('/admin/invitation-data', 'PUT', async (req, res) => {
    if (!req.session || !req.session.isAdmin) return res.status(401).json({ success: false });
    const token = req.headers['x-csrf-token'];
    if (token !== req.session.csrf) return res.status(403).json({ success: false, error: 'Forbidden' });

    const { id, data } = req.body || {};
    if (!id || !/^[\w.\-]+$/.test(id)) return res.status(400).json({ success: false, error: 'Bad request' });
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return res.status(400).json({ success: false, error: 'Invalid payload' });
    }

    try {
      await upsertInvitationData(id, data);
      res.json({ success: true });
    } catch (err) {
      reqLogger(req, 'Error saving admin invitation-data', err);
      res.status(500).json({ success: false, error: '서버 내부 에러가 발생했습니다.' });
    }
  }));

  // Serve thumbnail images for admin gallery
  router.get('/admin/thumbs/:id/:name', withMetrics('/admin/thumbs', 'GET', (req, res) => {
    if (!req.session || !req.session.isAdmin) return res.status(401).send('Unauthorized');
    const { id, name } = req.params;
    if (!/^[\w.\-]+$/.test(id) || !/^[\w.\-]+$/.test(name)) return res.status(400).send('Bad request');
    try {
      const base = getDataPath(id);
      const filePath = (function() {
        // thumbs are stored under "<base>/thumb/<name>"
        const p = path.normalize(path.join(base, 'thumb', name));
        if (!p.startsWith(base)) throw new Error('Invalid path');
        return p;
      })();
      res.sendFile(filePath, (err) => {
        if (err) res.status(err.statusCode || 404).send('Not found');
      });
    } catch {
      res.status(400).send('Bad request');
    }
  }));

  // Upload directly into "full" for admin gallery
  router.post('/admin/full-upload/:id', withMetrics('/admin/full-upload', 'POST', (req, res) => {
    if (!req.session || !req.session.isAdmin) return res.status(401).json({ success: false });
    const token = req.headers['x-csrf-token'];
    if (token !== req.session.csrf) return res.status(403).json({ success: false, error: 'Forbidden' });

    const { id } = req.params || {};
    if (!id || !/^[\w.\-]+$/.test(id)) return res.status(400).json({ success: false, error: 'Bad request' });

    const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }).single('image');
    memUpload(req, res, async (err) => {
      if (err) return res.status(400).json({ success: false, error: 'Upload error' });
      if (!req.file) return res.status(400).json({ success: false, error: 'No file' });

      // Only allow JPEG to keep naming consistent like "<index>.jpg"
      const isJpeg = (req.file.mimetype || '').toLowerCase() === 'image/jpeg'
        || /\.jpe?g$/i.test(req.file.originalname || '');
      if (!isJpeg) return res.status(415).json({ success: false, error: 'Only JPEG is allowed' });

      try {
        const baseDir = getDataPath(id);
        const fullDir = path.join(baseDir, 'full');
        if (!fsSync.existsSync(fullDir)) fsSync.mkdirSync(fullDir, { recursive: true });

        const files = await fs.readdir(fullDir).catch(() => []);
        let maxIdx = 0;
        for (const f of files) {
          const name = path.parse(f).name;
          const n = parseInt(name, 10);
          if (!Number.isNaN(n)) maxIdx = Math.max(maxIdx, n);
        }
        const nextIndex = maxIdx + 1;
        const finalName = `${nextIndex}.jpg`;
        const finalPath = path.join(fullDir, finalName);

        await fs.writeFile(finalPath, req.file.buffer);

        // Create thumbnail: width 500px JPEG saved as "<baseDir>/thumb/thumb_<finalName>"
        const thumbDir = path.join(baseDir, 'thumb');
        if (!fsSync.existsSync(thumbDir)) fsSync.mkdirSync(thumbDir, { recursive: true });
        const thumbPath = path.join(thumbDir, `thumb_${finalName}`);
        await sharp(req.file.buffer)
          .rotate()
          .resize({ width: 500, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(thumbPath);

        return res.json({ success: true, name: finalName });
      } catch (e) {
        reqLogger(req, 'Error in /admin/full-upload', e);
        return res.status(500).json({ success: false, error: 'Internal error' });
      }
    });
  }));

  return router;
};
