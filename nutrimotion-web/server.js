/**
 * Custom HTTPS Server for Next.js
 * Runs Next.js app on HTTPS with self-signed certificate
 */

const { createServer } = require('https');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = Number(process.env.PORT) || 3600;

// SSL certificate paths
const certPath = path.join(__dirname, 'cert', 'localhost.pem');
const keyPath = path.join(__dirname, 'cert', 'localhost-key.pem');

// Check if certificates exist
if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.log('⚠️  SSL certificates not found.');
  console.log('   Run: npm run cert:generate');
  console.log('   Or install mkcert: https://github.com/FiloSottile/mkcert');
  console.log('   Then run: mkcert localhost');
  process.exit(1);
}

// Load SSL certificates
let httpsOptions;
try {
  httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
} catch (error) {
  console.error('❌ Failed to load SSL certificates:', error.message);
  process.exit(1);
}

const app = next({ dev, hostname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      // Let Next.js handle URL parsing internally
      // Just pass req and res directly without URL manipulation
      await handle(req, res);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on https://${hostname}:${port}`);
    console.log(`> Environment: ${dev ? 'development' : 'production'}`);
  });
});
