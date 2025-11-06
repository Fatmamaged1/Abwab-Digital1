# Deployment Guide

This guide covers deployment options for the Abwab Digital API across different platforms and environments.

## 📋 Table of Contents

- [Deployment Options](#deployment-options)
- [Environment Setup](#environment-setup)
- [Platform-Specific Guides](#platform-specific-guides)
- [SSL Configuration](#ssl-configuration)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## 🚀 Deployment Options

### 1. Vercel (Recommended for Production)
- **Ease of Use**: ⭐⭐⭐⭐⭐
- **Cost**: Free tier available
- **Scaling**: Automatic
- **SSL**: Automatic
- **Domain**: Custom domains supported

### 2. DigitalOcean App Platform
- **Control**: ⭐⭐⭐⭐⭐
- **Cost**: From $12/month
- **Scaling**: Manual/Automatic
- **SSL**: Automatic
- **Domain**: Custom domains

### 3. AWS (Advanced)
- **Control**: ⭐⭐⭐⭐⭐
- **Cost**: Pay as you go
- **Scaling**: Full control
- **SSL**: Manual setup
- **Domain**: Route 53

### 4. Self-Hosted
- **Control**: ⭐⭐⭐⭐⭐
- **Cost**: Server costs only
- **Scaling**: Manual
- **SSL**: Manual setup
- **Domain**: Full control

## 🔧 Environment Setup

### Production Environment Variables

Create a `.env` file with production values:

```env
# Application
NODE_ENV=production
BASE_URL=https://yourdomain.com
PORT=4000

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/abwab-digital

# Security
JWT_SECRET_KEY=your-super-secret-production-key
JWT_EXPIRE_TIME=7d
SESSION_SECRET=your-session-secret-key
BCRYPT_SALT_ROUNDS=12

# Email
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password

# Redis (Optional)
REDIS_URL=redis://username:password@your-redis-instance

# SSL
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem

# Logging
LOG_LEVEL=warn

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/

# Newsletter Cron
NEWSLETTER_WEEKLY_DAY=2
NEWSLETTER_WEEKLY_HOUR=11
NEWSLETTER_MONTHLY_DAY=1
NEWSLETTER_MONTHLY_HOUR=10
```

## 📦 Platform-Specific Guides

### Vercel Deployment

#### Prerequisites
- Vercel account
- GitHub/GitLab/Bitbucket repository
- Domain name (optional)

#### Deployment Steps

1. **Connect Repository**
   ```bash
   # Push your code to GitHub/GitLab/Bitbucket
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Connect your repository
   - Vercel will auto-detect the Node.js project

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Project Settings
   - Add all environment variables from your `.env` file
   - Add build command: `npm run build` (if needed)
   - Add output directory: `./` (since it's a serverless function)

4. **Set Up Custom Domain** (Optional)
   - In Project Settings → Domains
   - Add your custom domain
   - Configure DNS records as instructed

5. **Deploy**
   ```bash
   # Vercel will automatically deploy on git push
   # Or manually deploy from dashboard
   ```

#### Vercel Configuration
The project includes `vercel.json` with optimized settings:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js",
      "methods": ["POST", "GET", "PUT", "DELETE", "PATCH", "OPTIONS"]
    }
  ]
}
```

### DigitalOcean App Platform

#### Prerequisites
- DigitalOcean account
- GitHub repository

#### Deployment Steps

1. **Create App**
   - Go to DigitalOcean Cloud Console
   - Navigate to "Apps" → "Create App"
   - Choose "GitHub" as source
   - Connect and select your repository

2. **Configure App**
   - **Branch**: `main` or `production`
   - **Source Directory**: `./` (root)
   - **Environment**: Node.js
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Environment Variables**
   - Add all production environment variables
   - Set `NODE_ENV=production`

4. **Resources**
   - **Plan**: Basic ($12/month) or higher
   - **Instance Count**: 1 (can be scaled later)

5. **Deploy**
   - DigitalOcean will automatically deploy
   - Access your app at the provided URL

#### Domain Configuration
```bash
# Point your domain to DigitalOcean
# Add CNAME record pointing to your-app-url.ondigitalocean.app

# In DigitalOcean dashboard:
# Apps → Your App → Settings → Domains
# Add your custom domain
```

### AWS Deployment

#### Prerequisites
- AWS account
- AWS CLI configured
- Domain name (optional)

#### Using Elastic Beanstalk

1. **Create Application**
   ```bash
   # Create Elastic Beanstalk application
   eb init abwab-digital-api
   eb create production-env
   ```

2. **Configure Environment**
   ```bash
   # Set environment variables
   eb setenv NODE_ENV=production
   eb setenv MONGO_URI=your-mongodb-uri
   eb setenv JWT_SECRET_KEY=your-secret
   # ... add other variables
   ```

3. **Deploy**
   ```bash
   # Deploy application
   eb deploy
   ```

#### Using ECS (Advanced)

1. **Create ECS Cluster**
   ```bash
   # Create cluster
   aws ecs create-cluster --cluster-name abwab-digital-cluster
   ```

2. **Build and Push Docker Image**
   ```dockerfile
   # Dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 4000
   CMD ["npm", "start"]
   ```

   ```bash
   # Build and push
   docker build -t abwab-digital-api .
   docker tag abwab-digital-api:latest your-registry/api:latest
   docker push your-registry/api:latest
   ```

3. **Deploy to ECS**
   ```bash
   # Create task definition, service, etc.
   # Use AWS Console or CLI
   ```

### Self-Hosted Deployment

#### VPS Setup (Ubuntu/Debian)

1. **Server Requirements**
   - Ubuntu 20.04+ or Debian 11+
   - 2GB RAM minimum
   - 1 CPU core minimum
   - 20GB storage minimum

2. **Initial Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install MongoDB (or use MongoDB Atlas)
   sudo apt-get install -y mongodb

   # Install Redis (optional)
   sudo apt-get install -y redis-server

   # Install PM2 for process management
   sudo npm install -g pm2
   ```

3. **Application Setup**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/abwab-digital-api.git
   cd abwab-digital-api

   # Install dependencies
   npm install --production

   # Setup environment
   cp .env.example .env
   # Edit .env with production values
   nano .env
   ```

4. **SSL Setup with Let's Encrypt**
   ```bash
   # Install Certbot
   sudo apt-get install -y certbot

   # Get SSL certificate
   sudo certbot certonly --standalone -d yourdomain.com

   # Auto-renewal
   sudo crontab -e
   # Add: 0 3 * * * certbot renew --quiet
   ```

5. **Start Application**
   ```bash
   # Start with PM2
   pm2 start server.js --name "abwab-digital-api"

   # Set to start on boot
   pm2 startup
   pm2 save

   # Enable PM2 web interface (optional)
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   ```

#### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine

   # Set working directory
   WORKDIR /app

   # Copy package files
   COPY package*.json ./

   # Install dependencies
   RUN npm ci --only=production

   # Copy application code
   COPY . .

   # Create uploads directory
   RUN mkdir -p uploads

   # Expose port
   EXPOSE 4000

   # Health check
   HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
     CMD curl -f http://localhost:4000/health || exit 1

   # Start application
   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'

   services:
     app:
       build: .
       ports:
         - "4000:4000"
         - "8080:8080"
       environment:
         - NODE_ENV=production
         - MONGO_URI=mongodb://mongo:27017/abwab-digital
         - JWT_SECRET_KEY=${JWT_SECRET_KEY}
       volumes:
         - uploads:/app/uploads
         - ./ssl:/etc/letsencrypt/live/yourdomain.com
       depends_on:
         - mongo
         - redis
       restart: unless-stopped

     mongo:
       image: mongo:6
       volumes:
         - mongodb_data:/data/db
       restart: unless-stopped

     redis:
       image: redis:7-alpine
       restart: unless-stopped

   volumes:
     uploads:
     mongodb_data:
   ```

3. **Deploy with Docker**
   ```bash
   # Build and start
   docker-compose up -d

   # View logs
   docker-compose logs -f app

   # Scale (if needed)
   docker-compose up -d --scale app=3
   ```

## 🔒 SSL Configuration

### Let's Encrypt (Recommended)

#### Automatic Setup
```bash
# Install Certbot
sudo apt-get install -y certbot

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Or for standalone
sudo certbot certonly --standalone -d yourdomain.com
```

#### Certificate Paths
- **Private Key**: `/etc/letsencrypt/live/yourdomain.com/privkey.pem`
- **Certificate**: `/etc/letsencrypt/live/yourdomain.com/fullchain.pem`
- **Auto-renewal**: Certificates auto-renew every 90 days

### Custom SSL Certificate

1. **Upload Certificate Files**
   - Place `.key` and `.crt` files in `/etc/ssl/certs/`
   - Update `server.js` SSL paths accordingly

2. **Update server.js**
   ```javascript
   const options = {
     key: fs.readFileSync('/etc/ssl/certs/yourdomain.key'),
     cert: fs.readFileSync('/etc/ssl/certs/yourdomain.crt')
   };
   ```

## 📊 Monitoring & Maintenance

### Health Checks

#### API Health Check
```bash
# Check if API is responding
curl -f https://yourdomain.com/api/v1/health

# Should return 200 OK
```

#### Database Health Check
```javascript
// Add health check endpoint to server.js
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Monitoring Tools

#### PM2 Monitoring
```bash
# View PM2 status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit
```

#### Application Metrics
```bash
# Install monitoring
npm install pm2-metrics

# Enable metrics
pm2 install pm2-metrics
pm2 set pm2-metrics:publicKey your-key
pm2 set pm2-metrics:privateKey your-private-key
```

### Log Management

#### Application Logs
```bash
# View application logs
pm2 logs abwab-digital-api

# View specific log file
tail -f /var/log/abwab-digital-api.log
```

#### System Logs
```bash
# View system logs
sudo journalctl -u abwab-digital-api -f

# Or traditional logs
sudo tail -f /var/log/syslog
```

### Database Maintenance

#### MongoDB Backup
```bash
# Create backup
mongodump --uri="mongodb://localhost:27017/abwab-digital" --out /backup/$(date +%Y%m%d)

# Restore backup
mongorestore --uri="mongodb://localhost:27017/abwab-digital" /backup/20250101
```

#### Redis Backup (if using)
```bash
# Save Redis data
redis-cli SAVE

# Copy dump file
cp /var/lib/redis/dump.rdb /backup/redis_$(date +%Y%m%d).rdb
```

### Performance Optimization

#### Enable Compression
```javascript
// In server.js
const compression = require('compression');
app.use(compression());
```

#### Database Indexing
```javascript
// Add indexes to frequently queried fields
// Example: User model
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ status: 1 });
```

#### Caching Strategy
```javascript
// Use Redis for caching
const redis = require('ioredis');
const client = redis.createClient();

// Cache middleware
const cache = (key, ttl = 3600) => {
  return async (req, res, next) => {
    const cached = await client.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    res.cache = (data) => {
      client.setex(key, ttl, JSON.stringify(data));
    };
    next();
  };
};
```

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
sudo lsof -i :4000

# Kill the process
sudo kill -9 <PID>

# Or use different port
PORT=4001 npm start
```

#### MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongo --eval "db.runCommand('ismaster')"
```

#### SSL Certificate Issues
```bash
# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout | grep "Not After"

# Renew certificate
sudo certbot renew

# Test SSL
curl -I -v https://yourdomain.com
```

#### High Memory Usage
```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart abwab-digital-api

# Check for memory leaks
npm install -g clinic
clinic heapprofiler -- node server.js
```

#### File Upload Issues
```bash
# Check upload directory permissions
ls -la uploads/

# Fix permissions
sudo chmod 755 uploads/
sudo chown -R www-data:www-data uploads/

# Check disk space
df -h
```

### Recovery Procedures

#### Database Recovery
```bash
# From backup
mongorestore --uri="mongodb://localhost:27017/abwab-digital" /path/to/backup

# Check database integrity
mongo --eval "db.stats()"
```

#### Application Rollback
```bash
# Using Git
git log --oneline -10  # Check recent commits
git reset --hard <commit-hash>  # Rollback to specific commit
npm install  # Reinstall dependencies
pm2 restart abwab-digital-api  # Restart app
```

#### Emergency Access
```bash
# If SSH is not working, use console access
# Most cloud providers offer web console

# Or use recovery mode
sudo systemctl rescue
# Make necessary fixes
sudo systemctl reboot
```

### Security Checklist

- [ ] SSL certificate is valid and not expired
- [ ] Environment variables are properly set
- [ ] Database credentials are secure
- [ ] API keys are rotated regularly
- [ ] Firewall is configured correctly
- [ ] Regular backups are running
- [ ] Security updates are applied
- [ ] Access logs are monitored
- [ ] Rate limiting is active
- [ ] Authentication is working properly

## 📞 Support

### Getting Help

1. **Check Logs**: Always check application and system logs first
2. **Test Locally**: Reproduce issues in development environment
3. **Check Documentation**: Review this deployment guide
4. **Search Issues**: Look for similar issues in project repository
5. **Contact Support**: Reach out to development team

### Emergency Contacts

- **Development Team**: development@abwabdigital.com
- **System Administrator**: admin@abwabdigital.com
- **Cloud Provider**: Check provider's support channels

## 📚 Additional Resources

- **Node.js Production Best Practices**: https://nodejs.org/en/docs/guides/
- **MongoDB Production Checklist**: https://docs.mongodb.com/manual/administration/production-checklist/
- **SSL/TLS Best Practices**: https://wiki.mozilla.org/Security/Server_Side_TLS
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/usage/quick-start/

---

**Last Updated**: January 2025
**Version**: 1.0.0
