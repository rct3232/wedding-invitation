const express = require('express');
const next = require('next');
const path = require('path');
const promClient = require('prom-client');
require('dotenv').config();

const initializeApiRoutes = require('./routes/api');

const port = process.env.PORT || 80;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const register = new promClient.Registry();

promClient.collectDefaultMetrics({ register });

app.prepare().then(() => {
  const server = express();
  
  server.use(express.json());

  // Redirect /gy28sep2501 to /?path=gy28sep2501 while preserving query string
  server.use((req, res, next) => {
    if (req.path === '/gy28sep2501') {
      const queryString = new URLSearchParams(req.query).toString();
      const redirectUrl = `/?path=gy28sep2501${queryString ? `&${queryString}` : ''}`;
      console.log(`[${new Date().toISOString()}] [${req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress}] redirecting to ${redirectUrl}`);
      return res.redirect(301, redirectUrl);
    }
    next();
  });
  
  server.use(express.static(path.join(__dirname, 'public')));
  server.all(/^\/_next\/.*/, (req, res) => handle(req, res));

  server.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  const apiRouter = initializeApiRoutes(register);
  server.use('/api', apiRouter);

  server.get('/share-photo', (req, res) => {
    const pathParam = req.query.path;
    if (!pathParam) {
      res.statusCode = 404;
      return app.render(req, res, '/_error', { statusCode: 404 });
    }

    const queryParams = { ...req.query, path: pathParam };
    return app.render(req, res, '/share-photo', queryParams);
  });
  
  server.all(/(.*)/, (req, res) => {
    const pathParam = req.query.path;
    if (!pathParam) {
      res.statusCode = 404;
      return app.render(req, res, '/_error', { statusCode: 404 });
    }
    return handle(req, res);
  });
  
  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});