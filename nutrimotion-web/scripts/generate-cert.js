/**
 * Generate Self-Signed SSL Certificate with SAN (Subject Alternative Name).
 * SAN is required by modern browsers to avoid ERR_CERT_COMMON_NAME_INVALID.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certDir = path.join(__dirname, '..', 'cert');
const certPath = path.join(certDir, 'localhost.pem');
const keyPath = path.join(certDir, 'localhost-key.pem');
const configPath = path.join(certDir, 'openssl-san.cnf');

const forceRegenerate = process.argv.includes('--force');

// Find OpenSSL
const opensslPaths = [
  'openssl',
  path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'OpenSSL-Win64', 'bin', 'openssl.exe'),
  path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'OpenSSL-Win32', 'bin', 'openssl.exe'),
  path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Git', 'usr', 'bin', 'openssl.exe'),
];
let openssl = opensslPaths.find((p) => {
  if (p === 'openssl') {
    try {
      execSync('openssl version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  return fs.existsSync(p);
});
if (!openssl) openssl = 'openssl';

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

if (fs.existsSync(certPath) && fs.existsSync(keyPath) && !forceRegenerate) {
  console.log('✅ SSL certificates already exist. Run with --force to regenerate.');
  process.exit(0);
}

if (forceRegenerate) {
  try {
    fs.unlinkSync(certPath);
    fs.unlinkSync(keyPath);
  } catch (e) {
    // ignore if missing
  }
}

console.log('🔐 Generating self-signed SSL certificate (with SAN for localhost & 127.0.0.1)...');

// OpenSSL config that adds Subject Alternative Name (required by Chrome/Edge)
const opensslConfig = `[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = localhost

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
`;

try {
  fs.writeFileSync(configPath, opensslConfig, 'utf8');

  const subj = '/C=US/ST=State/L=City/O=Nutrimotion/CN=localhost';
  execSync(
    `"${openssl}" req -x509 -newkey rsa:2048 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "${subj}" -config "${configPath}" -extensions v3_req`,
    { stdio: 'inherit', cwd: certDir }
  );

  try { fs.unlinkSync(configPath); } catch (_) {}

  console.log('✅ SSL certificates generated successfully!');
  console.log('📁 Certificates saved to:', certDir);
  console.log('🌐 Use https://localhost:3000 or https://127.0.0.1:3000');
  console.log('');
  console.log('To trust the cert and stop browser warnings (PowerShell as Administrator):');
  console.log('  certutil -addstore -f "Root" "' + path.resolve(certDir, 'localhost.pem') + '"');
  console.log('');
  console.log('See TROUBLESHOOTING.md for details.');
} catch (error) {
  console.error('❌ Failed to generate SSL certificates:', error.message);
  console.error('   Ensure OpenSSL is installed and in your PATH.');
  process.exit(1);
}
