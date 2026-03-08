# DRM Implementation Roadmap

This document outlines the implementation strategy for Digital Rights Management (DRM) in the Nutrimotion platform.

## Current Implementation (Phase 1 - MVP)

### Signed URLs
- ✅ Time-limited access tokens for media content
- ✅ HMAC-based signature verification
- ✅ URL expiration (24-hour default)
- ✅ User and device ID binding in tokens

### Device Registration
- ✅ Device fingerprint generation
- ✅ Device binding for content access
- ✅ Basic device verification

### Watermarking
- ✅ Unique watermark generation per user/content
- ⚠️ Visual watermarking not yet implemented (requires PDF/video processing)

## Phase 2 - Enhanced Security

### PDF DRM
**Recommended Solutions:**
- **Adobe Content Server** - Enterprise-grade PDF DRM
- **FileOpen** - Cloud-based PDF security
- **Locklizard** - Offline PDF DRM with device locking

**Implementation Steps:**
1. Choose DRM provider based on budget and requirements
2. Integrate provider SDK/API
3. Convert PDFs to protected format on upload
4. Implement license server integration
5. Update mobile apps with PDF reader that supports chosen DRM

### Video DRM
**Platform-Specific Solutions:**
- **Apple FairPlay Streaming** (iOS/tvOS/Safari)
- **Google Widevine** (Android/Chrome/Firefox)
- **Microsoft PlayReady** (Edge/Windows)

**Implementation Steps:**
1. Encode videos in multiple DRM formats
2. Set up license server (or use service like AWS Elemental MediaPackage)
3. Implement DRM key exchange
4. Update video players to support DRM
5. Configure multi-DRM proxy if needed (e.g., BuyDRM, EZDRM)

## Phase 3 - Production Hardening

### Cloud Storage Integration
- Integrate with AWS S3/CloudFront with signed URLs
- Or Azure Blob Storage with SAS tokens
- Or Google Cloud Storage with signed URLs

### Streaming Infrastructure
- Set up adaptive bitrate streaming (HLS/DASH)
- Configure CDN with DRM support
- Implement token-based authentication

### Monitoring & Analytics
- Track content access patterns
- Detect unauthorized sharing
- Monitor device registrations
- Alert on suspicious activity

## Device Binding Strategy

### Current Approach
- Generate device fingerprint from:
  - Device model/OS version
  - User agent
  - Unique device identifier (iOS: identifierForVendor, Android: Android ID)
  
### Enhanced Approach
- Store device fingerprints in database
- Limit number of devices per user (e.g., 3 devices)
- Allow users to manage registered devices
- Implement device revocation
- Add device authentication on each access

## Security Best Practices

1. **Key Management**
   - Store encryption keys in secure vaults (AWS Secrets Manager, Azure Key Vault)
   - Rotate keys regularly
   - Use different keys for different content types

2. **Access Control**
   - Verify user subscription status before issuing tokens
   - Check content entitlements
   - Implement rate limiting
   - Log all access attempts

3. **Content Protection**
   - Never expose raw content URLs
   - Always serve through proxy/CDN
   - Add visible watermarks for high-value content
   - Use forensic watermarking for tracking leaks

4. **Mobile App Security**
   - Implement certificate pinning
   - Obfuscate code
   - Use secure storage for tokens
   - Implement jailbreak/root detection

## Cost Considerations

### DRM Services (Approximate)
- **PDF DRM**: $50-$500/month depending on volume
- **Video DRM**: $0.01-$0.05 per license request
- **Multi-DRM Proxy**: $500-$2000/month
- **CDN with DRM**: $0.08-$0.15 per GB delivered

### Development Effort
- PDF DRM Integration: 2-3 weeks
- Video DRM Integration: 3-4 weeks
- Testing & QA: 2-3 weeks
- Total: ~2-3 months

## Recommended Vendors

### PDF Protection
1. **FileOpen** - Good balance of features and cost
2. **Locklizard** - Strong offline protection
3. **Adobe Content Server** - Enterprise solution

### Video DRM
1. **AWS Elemental MediaPackage** - Integrated solution
2. **BuyDRM KeyOS** - Mature multi-DRM platform
3. **EZDRM** - Cost-effective option

### Storage & CDN
1. **AWS CloudFront + S3** - Best integration with MediaPackage
2. **Azure Media Services** - Complete video platform
3. **Cloudflare Stream** - Simple pricing, good performance

## Migration Path

1. **Immediate (Phase 1)**
   - Continue using signed URLs for MVP
   - Implement device registration
   - Add basic watermarking

2. **3 Months (Phase 2)**
   - Integrate PDF DRM solution
   - Set up video encoding pipeline
   - Implement video DRM for web

3. **6 Months (Phase 3)**
   - Complete mobile app DRM integration
   - Add forensic watermarking
   - Implement content analytics
   - Full production deployment

## Testing Strategy

- Unit tests for token generation/verification
- Integration tests for DRM workflows
- Device compatibility testing
- Load testing for license server
- Penetration testing for security
- User acceptance testing for playback experience
