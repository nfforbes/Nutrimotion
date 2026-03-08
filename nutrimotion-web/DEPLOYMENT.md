# Deployment Guide

## Prerequisites

### Required Accounts
- [ ] Auth0 account (Production tenant)
- [ ] MongoDB Atlas account (M10+ cluster for production)
- [ ] Cloud provider account (AWS/Azure/GCP or Vercel)
- [ ] Domain registrar with DNS access
- [ ] SSL certificate provider
- [ ] Email service (SendGrid/AWS SES)
- [ ] SMS/WhatsApp service (Twilio)

### Required Tools
- Node.js 20+
- npm/yarn
- Git
- Docker (optional)

## Environment Setup

### Development
```bash
cp .env.example .env.local
# Edit .env.local with development credentials
npm install
npm run dev
```

### Staging
```bash
# Use .env.staging with staging credentials
npm run build
npm start
```

### Production
```bash
# Use .env.production with production credentials
npm run build
npm start
```

## Database Setup

### MongoDB Atlas

1. **Create Production Cluster**
   - Cluster tier: M10 or higher
   - Region: Choose closest to your users
   - Enable backups (continuous or snapshot)
   - Configure IP whitelist

2. **Create Database User**
   ```
   Username: nutrimotion-prod
   Password: <generate-strong-password>
   Roles: readWrite on nutrimotion database
   ```

3. **Connection String**
   ```
   mongodb+srv://nutrimotion-prod:<password>@cluster.mongodb.net/nutrimotion?retryWrites=true&w=majority
   ```

4. **Indexes**
   Run index creation:
   ```bash
   npm run db:indexes
   ```

5. **Initial Data**
   Seed admin user:
   ```bash
   npm run db:seed
   ```

## Auth0 Configuration

### Production Tenant Setup

1. **Create Application**
   - Type: Regular Web Application
   - Name: Nutrimotion Production
   - Allowed Callback URLs:
     - `https://nutrimotion.com/api/auth/callback`
     - `https://app.nutrimotion.com/api/auth/callback`
   - Allowed Logout URLs:
     - `https://nutrimotion.com`
     - `https://app.nutrimotion.com`

2. **Configure Rules**
   - Add user roles to JWT
   - Email verification enforcement
   - MFA for administrators

3. **API Configuration**
   - Create API: `https://api.nutrimotion.com`
   - Enable RBAC
   - Add permissions matching your permission matrix

4. **Social Connections** (Optional)
   - Google
   - Apple
   - Facebook

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Configure Project**
   ```bash
   vercel link
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add AUTH0_SECRET production
   vercel env add MONGODB_URI production
   # ... add all required env vars
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

5. **Configure Domain**
   - Add custom domain in Vercel dashboard
   - Update DNS records as instructed

### Option 2: AWS

#### Using AWS Amplify

1. **Connect Repository**
   - Link GitHub/GitLab repository
   - Configure build settings

2. **Environment Variables**
   - Add all env vars in Amplify console

3. **Build Configuration**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

#### Using ECS + Fargate

1. **Build Docker Image**
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Push to ECR**
   ```bash
   aws ecr create-repository --repository-name nutrimotion
   docker build -t nutrimotion .
   docker tag nutrimotion:latest <account-id>.dkr.ecr.<region>.amazonaws.com/nutrimotion:latest
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/nutrimotion:latest
   ```

3. **Create ECS Task Definition**
4. **Configure Load Balancer**
5. **Set up Auto Scaling**

### Option 3: Azure

#### Using Azure App Service

1. **Create App Service**
   ```bash
   az webapp create --name nutrimotion --resource-group nutrimotion-rg --plan nutrimotion-plan --runtime "NODE|20-lts"
   ```

2. **Configure Environment Variables**
   ```bash
   az webapp config appsettings set --name nutrimotion --resource-group nutrimotion-rg --settings AUTH0_SECRET=xxx MONGODB_URI=xxx
   ```

3. **Deploy**
   ```bash
   az webapp deploy --name nutrimotion --resource-group nutrimotion-rg --src-path ./build
   ```

## CDN & Static Assets

### Cloudflare

1. **Add Site to Cloudflare**
2. **Update Nameservers**
3. **Enable Features**:
   - Auto-minify (JS, CSS, HTML)
   - Brotli compression
   - HTTP/3 (QUIC)
   - Always Use HTTPS
   - Web Application Firewall (WAF)

### CloudFront (AWS)

1. **Create Distribution**
2. **Origin**: ALB or API Gateway
3. **Enable Caching**
4. **Configure SSL**

## Monitoring & Observability

### Application Monitoring

**Recommended: Datadog or New Relic**

```javascript
// lib/monitoring.ts
import { datadogRum } from '@datadog/browser-rum'

datadogRum.init({
  applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID,
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'nutrimotion-web',
  env: process.env.NODE_ENV,
  version: process.env.NEXT_PUBLIC_APP_VERSION,
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
})
```

### Error Tracking

**Recommended: Sentry**

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

### Uptime Monitoring

**Options:**
- Pingdom
- UptimeRobot
- StatusCake

Configure alerts for:
- Website down (check every 1 minute)
- API endpoints down
- High response time (>2s)

## Performance Optimization

### Pre-Deployment

1. **Build Analysis**
   ```bash
   npm run analyze
   ```

2. **Lighthouse Audit**
   - Target: 90+ score
   - Run on production build

3. **Load Testing**
   ```bash
   # Using k6
   k6 run load-test.js
   ```

### Post-Deployment

1. **Enable Caching**
   - Static assets: 1 year
   - API responses: As appropriate
   - Use stale-while-revalidate

2. **Image Optimization**
   - Use Next.js Image component
   - Configure image domains
   - Enable WebP/AVIF

3. **Code Splitting**
   - Dynamic imports for large components
   - Route-based code splitting (automatic with Next.js)

## Database Backup & Recovery

### MongoDB Atlas Backups

1. **Configure Backup Policy**
   - Continuous backup (point-in-time recovery)
   - Snapshot frequency: Every 24 hours
   - Retention: 7 days

2. **Test Recovery**
   - Monthly recovery drill
   - Document RTO/RPO

### Manual Backup

```bash
mongodump --uri="mongodb+srv://..." --out=./backup-$(date +%Y%m%d)
```

## Disaster Recovery

### Backup Strategy

1. **Database**: Continuous backup via Atlas
2. **Media Files**: Cross-region replication in S3/Azure Blob
3. **Code**: Git repository (GitHub/GitLab)
4. **Configuration**: Stored in Secrets Manager

### Recovery Procedures

1. **Complete Outage**
   - Switch DNS to backup region
   - Restore database from latest backup
   - Deploy application to backup environment
   - ETA: 15-30 minutes

2. **Data Corruption**
   - Identify corruption time
   - Restore from point-in-time backup
   - Re-process affected transactions
   - ETA: 1-2 hours

## Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database indexes created
- [ ] SSL certificate active
- [ ] CDN configured
- [ ] Monitoring dashboards set up
- [ ] Error tracking enabled
- [ ] Backup verification completed
- [ ] Load testing passed
- [ ] Security scan completed
- [ ] Health check endpoints responding
- [ ] Domain DNS propagated
- [ ] Auth0 production tenant active
- [ ] Email notifications working
- [ ] Push notifications working (mobile)
- [ ] Payment processing tested
- [ ] Admin access verified
- [ ] Documentation updated
- [ ] Team trained on ops procedures
- [ ] On-call rotation scheduled

## Maintenance

### Daily
- [ ] Check error rates
- [ ] Review monitoring dashboards
- [ ] Check backup status

### Weekly
- [ ] Review performance metrics
- [ ] Update dependencies
- [ ] Review security alerts

### Monthly
- [ ] Database performance review
- [ ] Cost optimization review
- [ ] Security patch updates
- [ ] Backup restore test

### Quarterly
- [ ] Rotate credentials
- [ ] Review access permissions
- [ ] Capacity planning
- [ ] Disaster recovery drill

## Rollback Procedures

### Vercel
```bash
vercel rollback
```

### AWS
```bash
# Revert to previous task definition
aws ecs update-service --cluster nutrimotion --service web --task-definition nutrimotion:previous
```

### Database Rollback
```bash
# Restore from specific point in time
# Use MongoDB Atlas UI or CLI
```

## Support Contacts

- Infrastructure: ops@nutrimotion.com
- Database: dba@nutrimotion.com
- Security: security@nutrimotion.com
- On-call: +1-XXX-XXX-XXXX
