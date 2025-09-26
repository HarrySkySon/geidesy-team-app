# SSL Certificates and Domain Setup Guide

This guide provides comprehensive instructions for setting up SSL certificates and configuring domains for the Surveying Team Management System.

## 📋 Prerequisites

- Domain name registered and pointed to your server
- Server with root access
- Docker and Docker Compose installed
- Nginx configured (included in our production setup)

## 🏷️ Domain Configuration

### 1. DNS Records Setup

Configure the following DNS records for your domain:

```
Type    Name    Value               TTL
A       @       YOUR_SERVER_IP      300
A       www     YOUR_SERVER_IP      300
CNAME   api     your-domain.com     300
CNAME   app     your-domain.com     300
```

### 2. Subdomain Structure

Our application uses the following subdomain structure:

- `https://your-domain.com` - Main web application
- `https://api.your-domain.com/api` - API endpoints
- `https://admin.your-domain.com:8080` - Admin panel (internal)

## 🔒 SSL Certificate Options

### Option 1: Let's Encrypt (Recommended for Production)

**Advantages:**
- Free and trusted by all major browsers
- Automatic renewal
- Industry standard

**Setup Steps:**

1. **Run the SSL setup script:**
   ```bash
   sudo chmod +x scripts/ssl/setup-ssl.sh
   sudo ./scripts/ssl/setup-ssl.sh your-domain.com admin@your-domain.com
   ```

2. **Select option 2** from the menu for Let's Encrypt

3. **The script will:**
   - Install certbot
   - Stop nginx temporarily
   - Obtain certificates from Let's Encrypt
   - Configure automatic renewal
   - Start nginx with SSL enabled

### Option 2: Self-Signed Certificates (Development Only)

**Use for:**
- Local development
- Testing environments
- Internal networks

**Setup Steps:**

1. **Run the SSL setup script:**
   ```bash
   sudo ./scripts/ssl/setup-ssl.sh your-domain.com
   ```

2. **Select option 1** from the menu

3. **Accept browser warnings** (expected for self-signed certificates)

### Option 3: Commercial SSL Certificate

If you have a commercial SSL certificate:

1. **Copy your certificate files:**
   ```bash
   sudo cp your-certificate.crt /etc/nginx/ssl/cert.pem
   sudo cp your-private-key.key /etc/nginx/ssl/key.pem
   sudo chmod 600 /etc/nginx/ssl/key.pem
   sudo chmod 644 /etc/nginx/ssl/cert.pem
   ```

2. **Validate the certificates:**
   ```bash
   sudo ./scripts/ssl/setup-ssl.sh
   # Select option 3 to validate
   ```

## 🚀 Production Deployment Steps

### Step 1: Update Environment Variables

Edit `.env.production`:

```bash
# Update these values with your actual domain
FRONTEND_URL=https://your-domain.com
API_BASE_URL=https://your-domain.com/api
WEBSOCKET_URL=wss://your-domain.com

# Update SSL paths if different
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

### Step 2: Update Nginx Configuration

Edit `docker/production/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;  # Update this line

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Rest of configuration...
}
```

### Step 3: Deploy with SSL

```bash
# Copy production environment
cp .env.production .env

# Start the application with SSL
docker-compose -f docker-compose.prod.yml up -d

# Check SSL status
./scripts/ssl/setup-ssl.sh
# Select option 5 to test SSL
```

## 🔍 Verification and Testing

### 1. Basic Connectivity Test

```bash
# Test HTTP to HTTPS redirect
curl -I http://your-domain.com

# Test HTTPS connection
curl -I https://your-domain.com

# Test API endpoint
curl -I https://your-domain.com/api/health
```

### 2. SSL Certificate Validation

```bash
# Check certificate details
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check certificate expiration
openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout | grep "Not After"
```

### 3. Browser Testing

1. **Open your domain in a browser**
2. **Check for the lock icon** in the address bar
3. **Verify certificate details** by clicking the lock icon
4. **Test all major browsers:** Chrome, Firefox, Safari, Edge

### 4. SSL Testing Tools

- **SSL Labs Test:** https://www.ssllabs.com/ssltest/
- **SSL Checker:** https://www.sslshopper.com/ssl-checker.html

## 🔄 Certificate Renewal

### Automatic Renewal (Let's Encrypt)

Let's Encrypt certificates are automatically renewed by the setup script. Check renewal status:

```bash
# Test renewal process
sudo certbot renew --dry-run

# Check renewal cron job
sudo cat /etc/cron.d/certbot-renewal
```

### Manual Renewal

If needed, renew certificates manually:

```bash
# Stop nginx
sudo systemctl stop nginx

# Renew certificate
sudo certbot renew

# Copy new certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /etc/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /etc/nginx/ssl/key.pem

# Start nginx
sudo systemctl start nginx
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Certificate Not Trusted

**Problem:** Browser shows "Not Secure" warning

**Solutions:**
- Ensure you're using Let's Encrypt or commercial certificate
- Check certificate chain completeness
- Verify domain name matches certificate

#### 2. Mixed Content Warnings

**Problem:** Some resources load over HTTP instead of HTTPS

**Solutions:**
- Update all internal links to use HTTPS
- Check API calls are using HTTPS URLs
- Enable HSTS headers

#### 3. Certificate Expired

**Problem:** Browser shows expired certificate error

**Solutions:**
- Check certificate expiration date
- Renew certificate immediately
- Verify automatic renewal is working

#### 4. Port 443 Connection Refused

**Problem:** Cannot connect to HTTPS port

**Solutions:**
- Check if port 443 is open in firewall
- Verify nginx is running
- Check docker container status

### Diagnostic Commands

```bash
# Check nginx configuration
sudo nginx -t

# Check SSL certificate
sudo openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout

# Check nginx logs
sudo docker-compose -f docker-compose.prod.yml logs nginx

# Check certificate expiration
sudo openssl x509 -in /etc/nginx/ssl/cert.pem -noout -dates

# Test SSL handshake
sudo openssl s_client -connect your-domain.com:443
```

## 📁 File Locations

- **SSL Certificates:** `/etc/nginx/ssl/`
- **Let's Encrypt:** `/etc/letsencrypt/`
- **Nginx Config:** `docker/production/nginx.conf`
- **Environment:** `.env.production`
- **Setup Script:** `scripts/ssl/setup-ssl.sh`

## 🔒 Security Best Practices

1. **Use strong SSL configuration:**
   - TLS 1.2 and 1.3 only
   - Strong cipher suites
   - HSTS enabled

2. **Regular updates:**
   - Keep certificates up to date
   - Monitor expiration dates
   - Update SSL configurations

3. **Monitoring:**
   - Set up certificate expiration alerts
   - Monitor SSL health
   - Regular security scans

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Run diagnostics: `./scripts/ssl/setup-ssl.sh` (option 5)
3. Review nginx configuration
4. Check DNS propagation
5. Verify firewall settings

For additional help, refer to:
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)