import { createSign, sign as cryptoSign } from 'crypto';

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

/** PEM keys pasted into env vars often arrive with literal "\n". */
export function normalizePem(pem: string): string {
  return pem.includes('\\n') ? pem.replace(/\\n/g, '\n') : pem;
}

export function signRs256(claims: Record<string, unknown>, privateKeyPem: string): string {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify(claims));
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  return `${header}.${payload}.${base64url(signer.sign(normalizePem(privateKeyPem)))}`;
}

export function signEs256(
  claims: Record<string, unknown>,
  privateKeyPem: string,
  keyId: string
): string {
  const header = base64url(JSON.stringify({ alg: 'ES256', kid: keyId }));
  const payload = base64url(JSON.stringify(claims));
  const signature = cryptoSign('sha256', Buffer.from(`${header}.${payload}`), {
    key: normalizePem(privateKeyPem),
    dsaEncoding: 'ieee-p1363',
  });
  return `${header}.${payload}.${base64url(signature)}`;
}
