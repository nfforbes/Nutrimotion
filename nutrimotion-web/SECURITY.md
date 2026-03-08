# Security Guidelines

## Authentication & Authorization

### Auth0 Configuration
- Enable MFA for admin accounts
- Configure session timeout (24 hours rolling, 7 days absolute)
- Set up email verification
- Enable brute force protection
- Configure allowed callback URLs and logout URLs

### JWT Security
- Tokens stored in HTTP-only cookies
- Token expiration: 24 hours
- Refresh tokens: 7 days
- Implement token rotation
- Validate tokens on every request

### Role-Based Access Control (RBAC)
- Enforce permissions at both UI and API layers
- Never trust client-side permission checks
- Use middleware for API route protection
- Implement principle of least privilege

## API Security

### Request Validation
- Validate all input with Zod schemas
- Sanitize user input
- Implement rate limiting (100 requests/minute per IP)
- Set request size limits (10MB)

### CORS Configuration
```javascript
// Allow only authorized domains
const allowedOrigins = [
  'https://nutrimotion.com',
  'https://www.nutrimotion.com',
  'https://app.nutrimotion.com'
];
```

### Security Headers
Implement the following headers:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`: Strict CSP policy

## Database Security

### MongoDB Security
- Use strong passwords (32+ characters)
- Enable authentication
- Use connection string encryption
- Implement IP whitelisting
- Enable MongoDB Atlas encryption at rest
- Use MongoDB Atlas private endpoints

### Data Encryption
- Sensitive fields encrypted at application level
- Use environment variables for secrets
- Never commit secrets to version control
- Rotate database credentials quarterly

### Connection Security
- Use TLS/SSL for database connections
- Connection pooling with max connections limit
- Connection timeout: 30 seconds
- Socket timeout: 45 seconds

## Content Security

### File Uploads
- Validate file types and sizes
- Scan uploads for malware
- Store files in cloud storage (not file system)
- Use signed URLs for access
- Implement upload rate limiting

### DRM & Content Protection
- Generate time-limited signed URLs
- Implement device binding
- Add watermarks to sensitive content
- Log all content access
- Monitor for unusual access patterns

## Infrastructure Security

### Environment Variables
Required environment variables:
```
AUTH0_SECRET=<generated-with-openssl-rand-hex-32>
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=<from-auth0-dashboard>
AUTH0_CLIENT_SECRET=<from-auth0-dashboard>
MONGODB_URI=mongodb+srv://...
MEDIA_SECRET=<generated-with-openssl-rand-hex-32>
```

### Secrets Management
- Use AWS Secrets Manager or Azure Key Vault in production
- Rotate secrets every 90 days
- Use different secrets for each environment
- Implement secret scanning in CI/CD

### Network Security
- Use VPC/Virtual Network
- Implement Web Application Firewall (WAF)
- Enable DDoS protection
- Use private subnets for databases
- Implement bastion hosts for admin access

## Monitoring & Logging

### Security Monitoring
- Log all authentication attempts
- Track failed login attempts
- Monitor API rate limits
- Alert on suspicious patterns
- Track privileged operations

### Audit Logging
Log the following events:
- User authentication/logout
- Permission changes
- Order creation/modifications
- Delivery status updates
- Content access
- Admin operations

### Log Storage
- Centralized logging (AWS CloudWatch, Azure Monitor, or Datadog)
- Retain logs for 90 days minimum
- Encrypt logs at rest and in transit
- Implement log integrity verification

## Incident Response

### Security Incident Plan
1. **Detect**: Monitoring alerts trigger investigation
2. **Contain**: Isolate affected systems
3. **Investigate**: Determine scope and impact
4. **Remediate**: Fix vulnerability
5. **Recover**: Restore normal operations
6. **Review**: Post-incident analysis

### Contact Information
- Security Lead: security@nutrimotion.com
- On-call: +1-XXX-XXX-XXXX
- Escalation: cto@nutrimotion.com

## Compliance

### GDPR Requirements
- Implement right to be forgotten
- Data export functionality
- Privacy policy and consent management
- Data processing agreements

### PCI-DSS (if processing cards)
- Use PCI-compliant payment processor
- Never store card data
- Implement tokenization
- Annual PCI audit

## Security Checklist

### Pre-Production
- [ ] Security audit completed
- [ ] Penetration testing performed
- [ ] Dependencies vulnerability scan clean
- [ ] Secrets rotated
- [ ] SSL certificates configured
- [ ] WAF rules configured
- [ ] Monitoring alerts set up
- [ ] Incident response plan documented
- [ ] Team security training completed

### Production
- [ ] Enable production logging
- [ ] Configure backup strategy
- [ ] Set up disaster recovery
- [ ] Implement CDN with DDoS protection
- [ ] Enable auto-scaling
- [ ] Configure health checks
- [ ] Set up uptime monitoring

### Ongoing
- [ ] Weekly dependency updates
- [ ] Monthly security patches
- [ ] Quarterly access review
- [ ] Quarterly credential rotation
- [ ] Semi-annual penetration testing
- [ ] Annual security audit

## Vulnerability Disclosure

If you discover a security vulnerability:
1. Email security@nutrimotion.com
2. Include detailed description
3. Do not publicly disclose until patched
4. We will respond within 48 hours
5. Coordinated disclosure after fix

## Security Updates

Stay informed:
- Subscribe to security advisories
- Monitor npm audit
- Track Auth0 security bulletins
- Follow MongoDB security updates
- Review Next.js security releases
