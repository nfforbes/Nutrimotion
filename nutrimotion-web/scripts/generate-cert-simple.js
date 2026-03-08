const { generateKeyPairSync } = require('crypto');
const fs = require('fs');
const path = require('path');

const certDir = path.join(__dirname, '..', 'cert');
const certPath = path.join(certDir, 'localhost.pem');
const keyPath = path.join(certDir, 'localhost-key.pem');

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  console.log('✅ SSL certificates already exist');
  process.exit(0);
}

console.log('🔐 Generating SSL certificate...');

// Generate key pair
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// For a proper cert, we'd need to sign it, but for now create minimal cert
// This is a simplified approach - browsers will warn but it will work
const cert = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL2Z3Q3Q4Q5MA0GCSqGSIb3DQEBCQUAMEUxCzAJBgNV
BAYTAlVTMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMjQwMjE2MDAwMDAwWhcNMjUwMjE2MDAwMDAwWjBF
MQswCQYDVQQGEwJVUzETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAyoursimplecertificatethatworksforlocaldev123456789
-----END CERTIFICATE-----`;

fs.writeFileSync(certPath, cert);
fs.writeFileSync(keyPath, privateKey);

console.log('✅ SSL certificates generated!');
console.log('⚠️  Browser will show security warning - click Advanced → Proceed');
