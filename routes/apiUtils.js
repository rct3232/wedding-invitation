const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs');

function reqLogger(req, msg, err) {
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
}

async function cleanupArtifacts(fileId, tmpDir, finalPath) {
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
  }
}

module.exports = {
  reqLogger,
  cleanupArtifacts,
  getDataPath: (...segments) => path.join(__dirname, '..', 'data', ...segments),
  safeReadJSON: async (filePath, defaultValue) => {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      if (e.code === 'ENOENT' && defaultValue !== undefined) return defaultValue;
      throw e;
    }
  },
  createMetricsWrapper: (apiRequestDurationSeconds, apiRequestsTotal) => (route, method, handler) => {
    return async function wrapped(req, res, next) {
      const queryParam = req.params.query || '';
      const end = apiRequestDurationSeconds.startTimer({ route, method, query_param: queryParam });
      let finished = false;
      const finalize = () => {
        if (finished) return;
        finished = true;
        end();
        apiRequestsTotal.labels(route, method, res.statusCode, queryParam).inc();
      };
      res.on('finish', finalize);
      res.on('close', finalize);
      try {
        await handler(req, res, next);
      } catch (err) {
        reqLogger(req, 'Unhandled route error', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: '서버 내부 에러가 발생했습니다.' });
        }
      }
    };
  }
};
