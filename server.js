const express = require('express');
const next = require('next');
const path = require('path');
const promClient = require('prom-client');
require('dotenv').config();

const initializeApiRoutes = require('./routes/api'); // Renamed to reflect it's a function
const { console } = require('inspector');

const port = process.env.PORT || 3100;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add default metrics
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

  // Metrics endpoint
  server.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  // Initialize API routes with the registry
  const apiRouter = initializeApiRoutes(register);
  server.use('/api', apiRouter);
  
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