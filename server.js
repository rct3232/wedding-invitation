const express = require('express');
const next = require('next');
const path = require('path');
const promClient = require('prom-client');
require('dotenv').config();

// Security/session deps and utils
const session = require('express-session');
const helmet = require('helmet');
const crypto = require('crypto');
const initializeApiRoutes = require('./routes/api');

const port = process.env.PORT || 80;
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
  server.use(express.urlencoded({ extended: true }));
  
  // Trust reverse proxy (needed for secure cookies behind TLS terminator like Nginx)
  server.set('trust proxy', 1);
  server.use(helmet({ contentSecurityPolicy: false }));
  server.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    proxy: true, // ensure secure cookie set behind trusted proxy
    cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
  }));
  
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

  // ----- Admin pages via Next.js -----
  server.get('/admin/login', (req, res) => {
    if (!process.env.ADMIN_ID || !process.env.ADMIN_PW) return res.status(500).send('ADMIN env not configured');
    if (req.session.isAdmin) return res.redirect('/admin');
    return app.render(req, res, '/admin/login', {});
  });

  server.get('/admin', (req, res) => {
    if (req.session && req.session.isAdmin) return app.render(req, res, '/admin', {});
    return res.redirect('/admin/login');
  });

  server.get('/share-photo', (req, res) => {
    const pathParam = req.query.path;
    if (!pathParam) {
      res.statusCode = 404;
      return app.render(req, res, '/_error', { statusCode: 404 });
    }

    const queryParams = { ...req.query, path: pathParam }; // Pass the path parameter
    return app.render(req, res, '/share-photo', queryParams);
  });
  
  // Allow Next.js to handle /admin; keep path param requirement elsewhere
  server.all(/(.*)/, (req, res) => {
    if (req.path.startsWith('/admin')) {
      return handle(req, res);
    }
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