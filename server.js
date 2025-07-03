const express = require('express');
const next = require('next');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const port = process.env.PORT || 3100;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  
  server.use(express.json());
  
  server.use(express.static(path.join(__dirname, 'public')));
  server.all(/^\/_next\/.*/, (req, res) => handle(req, res));

  // Use routes
  server.use('/api', apiRoutes);
  
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