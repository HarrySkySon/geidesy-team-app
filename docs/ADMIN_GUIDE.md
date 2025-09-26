# 🔧 Administrator Guide - Surveying Team Management System

**Version:** 1.0  
**Last Updated:** 2024-09-25  
**Target Audience:** System administrators, DevOps engineers

---

## 🎯 **Administration Overview**

This guide covers system administration, deployment, monitoring, and maintenance tasks for the Surveying Team Management System.

---

## 🚀 **Deployment Guide**

### **Production Deployment**

#### **Prerequisites**
- Linux server (Ubuntu 20.04+ recommended)
- Docker and Docker Compose installed
- Domain name and SSL certificate
- Minimum 4GB RAM, 2 CPU cores, 50GB storage

#### **Quick Start Deployment**
```bash
# 1. Clone repository
git clone https://github.com/HarrySkySon/geidesy-team-app.git
cd geidesy-team-app

# 2. Configure environment
cp .env.production .env
# Edit .env with your actual values

# 3. Set up SSL certificates
sudo ./scripts/ssl/setup-ssl.sh your-domain.com admin@your-domain.com

# 4. Deploy services
docker-compose -f docker-compose.prod.yml up -d

# 5. Initialize database
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed

# 6. Verify deployment
curl -f https://your-domain.com/health
```

#### **Service Architecture**
```
┌─── Nginx (Load Balancer) ───┐
│     Port: 80, 443           │
└─────────────────────────────┘
           │
    ┌──────┼──────┐
    │             │
┌───▼───┐   ┌────▼────┐
│Frontend│   │ Backend │
│:3000   │   │ :3000   │
└────────┘   └────┬────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
   ┌────▼───┐ ┌──▼──┐ ┌────▼────┐
   │PostgreSQL Redis │  MinIO   │
   │:5432   │:6379 │  │:9000    │
   └────────┘ └─────┘  └─────────┘
```

---

## ⚙️ **Configuration Management**

### **Environment Variables**

#### **Critical Settings**
```bash
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/db

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# File Storage
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=your-minio-password

# SSL/Security
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

#### **Feature Flags**
```bash
# Enable/disable features
ENABLE_ANALYTICS=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_OFFLINE_SYNC=true
ENABLE_REAL_TIME_UPDATES=true
```

#### **Performance Tuning**
```bash
# Database connections
DATABASE_POOL_SIZE=20
REDIS_MAX_CONNECTIONS=10

# File uploads
MAX_FILE_UPLOAD_SIZE=100MB
UPLOAD_TIMEOUT=300s

# Rate limiting
API_RATE_LIMIT=100
UPLOAD_RATE_LIMIT=10
```

### **Service Configuration**

#### **Nginx Configuration**
Location: `docker/production/nginx.conf`

Key settings:
- SSL/TLS configuration
- Rate limiting rules
- Proxy settings
- Static file caching

#### **Database Configuration**
```sql
-- Performance settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
```

#### **Redis Configuration**
```bash
# Memory optimization
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
```

---

## 👥 **User Management**

### **Creating Administrator Account**
```bash
# Access backend container
docker-compose -f docker-compose.prod.yml exec backend bash

# Create admin user
npm run create-admin --email=admin@your-domain.com --password=secure-password
```

### **User Roles and Permissions**
- **Admin**: Full system access
- **Team Leader**: Team management, task assignment
- **Team Member**: Task execution, status updates
- **Viewer**: Read-only access

### **Bulk User Import**
```bash
# CSV format: email,name,role,team
# Example: john@company.com,John Doe,team_member,Team Alpha

docker-compose -f docker-compose.prod.yml exec backend \
  npm run import-users --file=/path/to/users.csv
```

---

## 📊 **Monitoring and Alerts**

### **Service Health Monitoring**

#### **Health Check Endpoints**
```bash
# Application health
curl https://your-domain.com/api/health

# Database health
curl https://your-domain.com/api/health/db

# Redis health
curl https://your-domain.com/api/health/redis

# Storage health
curl https://your-domain.com/api/health/storage
```

#### **Grafana Dashboards**
Access: `https://your-domain.com:8080/grafana`

Default dashboards:
- System Overview
- API Performance
- Database Metrics
- User Activity

#### **Log Management**

**Application Logs**
```bash
# View backend logs
docker-compose -f docker-compose.prod.yml logs backend

# View nginx logs
docker-compose -f docker-compose.prod.yml logs nginx

# Real-time log following
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

**Centralized Logging**
- **Elasticsearch**: Log storage and indexing
- **Kibana**: Log visualization and analysis
- **Access**: `https://your-domain.com:8080/kibana`

### **Alert Configuration**

#### **Critical Alerts**
- Service down (immediate)
- High error rate (5 minutes)
- Database connection failures
- SSL certificate expiration (30 days)

#### **Warning Alerts**
- High response times (>2s)
- Memory usage >80%
- Disk space <20%
- High concurrent users

#### **Notification Channels**
Configure in `.env`:
```bash
# Email notifications
SMTP_HOST=smtp.your-domain.com
ALERT_EMAIL=admin@your-domain.com

# Slack integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# SMS alerts (critical only)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
```

---

## 🔒 **Security Management**

### **SSL Certificate Management**

#### **Auto-renewal (Let's Encrypt)**
```bash
# Check renewal status
sudo certbot certificates

# Manual renewal
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

#### **Certificate Monitoring**
```bash
# Check certificate expiration
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

### **Security Scanning**

#### **Regular Security Checks**
```bash
# Run security audit
npm audit --audit-level moderate

# Container vulnerability scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd):/path aquasec/trivy image your-image

# SSL configuration test
./scripts/ssl/setup-ssl.sh your-domain.com
# Select option 5
```

### **Access Control**

#### **Network Security**
- Firewall rules (ports 80, 443, 22)
- VPN access for administration
- IP whitelist for admin interfaces

#### **Authentication Security**
- Strong password policies
- JWT token expiration (15 minutes)
- Session timeout (24 hours)
- Two-factor authentication (optional)

---

## 📊 **Database Administration**

### **Database Maintenance**

#### **Regular Tasks**
```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U surveying_user surveying_db_prod > backup_$(date +%Y%m%d).sql

# Vacuum and analyze
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U surveying_user -d surveying_db_prod -c "VACUUM ANALYZE;"

# Check database size
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U surveying_user -d surveying_db_prod -c \
  "SELECT pg_size_pretty(pg_database_size('surveying_db_prod'));"
```

#### **Performance Monitoring**
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Long running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Database statistics
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats WHERE tablename = 'tasks';
```

### **Data Migration**

#### **Schema Updates**
```bash
# Apply migrations
docker-compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate deploy

# Generate migration
docker-compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate dev --name description_of_changes
```

#### **Data Import/Export**
```bash
# Export data
docker-compose -f docker-compose.prod.yml exec backend \
  npm run export-data --type=tasks --format=csv

# Import data
docker-compose -f docker-compose.prod.yml exec backend \
  npm run import-data --file=/path/to/data.csv --type=tasks
```

---

## 🔧 **Maintenance Tasks**

### **Regular Maintenance Schedule**

#### **Daily Tasks**
- [ ] Check service health
- [ ] Monitor error rates
- [ ] Verify backup completion
- [ ] Review security logs

#### **Weekly Tasks**
- [ ] Update system packages
- [ ] Clean old log files
- [ ] Check SSL certificate validity
- [ ] Review user activity

#### **Monthly Tasks**
- [ ] Security patches
- [ ] Database optimization
- [ ] Storage cleanup
- [ ] Performance review

### **System Updates**

#### **Application Updates**
```bash
# Pull latest changes
git pull origin master

# Update Docker images
docker-compose -f docker-compose.prod.yml pull

# Deploy updates
docker-compose -f docker-compose.prod.yml up -d

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate deploy
```

#### **Security Updates**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker
sudo apt install docker.io docker-compose

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Service Won't Start**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs service-name

# Check configuration
docker-compose -f docker-compose.prod.yml config

# Restart service
docker-compose -f docker-compose.prod.yml restart service-name
```

#### **Database Connection Issues**
```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U surveying_user -d surveying_db_prod -c "SELECT 1;"

# Check connection pool
docker-compose -f docker-compose.prod.yml exec backend \
  npm run check-db-connections
```

#### **SSL Certificate Problems**
```bash
# Validate certificate
./scripts/ssl/setup-ssl.sh your-domain.com
# Select option 3

# Check certificate chain
curl -I https://your-domain.com
```

#### **Performance Issues**
```bash
# Check resource usage
docker stats

# Monitor database performance
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U surveying_user -d surveying_db_prod -c \
  "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### **Emergency Procedures**

#### **Service Recovery**
```bash
# Quick restart all services
docker-compose -f docker-compose.prod.yml restart

# Full rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

#### **Data Recovery**
```bash
# Restore from backup
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U surveying_user -d surveying_db_prod < backup_20241225.sql

# Restore MinIO files
docker-compose -f docker-compose.prod.yml exec minio \
  mc cp --recursive backup/files/ minio/surveying-files/
```

---

## 📞 **Support and Resources**

### **Documentation**
- [Installation Guide](INSTALLATION.md)
- [API Documentation](API_DOCUMENTATION.md)
- [User Guide](USER_GUIDE.md)
- [Security Guide](SECURITY.md)

### **Community and Support**
- GitHub Issues: Report bugs and feature requests
- Documentation: Submit documentation improvements
- Community Forum: Ask questions and share knowledge

### **Emergency Contacts**
- **System Administrator**: admin@your-domain.com
- **DevOps Team**: devops@your-domain.com
- **Security Team**: security@your-domain.com

---

## 📋 **Checklist Templates**

### **Pre-Deployment Checklist**
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations completed
- [ ] Security settings verified
- [ ] Monitoring configured
- [ ] Backup system tested
- [ ] DNS records updated
- [ ] Load testing completed

### **Post-Deployment Checklist**
- [ ] All services healthy
- [ ] SSL certificate valid
- [ ] Database accessible
- [ ] File uploads working
- [ ] Real-time features active
- [ ] Monitoring alerts configured
- [ ] Backup completed successfully
- [ ] Documentation updated

---

**🔧 Administrator Resources**
- **System Status**: https://status.your-domain.com
- **Monitoring**: https://your-domain.com:8080/grafana
- **Logs**: https://your-domain.com:8080/kibana
- **API Docs**: https://your-domain.com/api/docs