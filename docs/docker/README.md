# 🐳 Docker Environment Documentation

This documentation covers the complete Docker infrastructure setup for the Exchanger application, including development and production environments.

## 📁 Directory Structure

```
scripts/docker/
├── dev-up.sh          # Development environment startup
├── dev-down.sh        # Development environment teardown
├── prod-deploy.sh     # Production deployment
└── prod-manage.sh     # Production management

docker/
├── postgres/
│   ├── init.sql       # Development database initialization
│   └── init-prod.sql  # Production database initialization
└── redis/
    ├── redis.conf     # Development Redis configuration
    └── redis-prod.conf # Production Redis configuration

packages/session-management/
└── prisma/
    └── schema.prisma  # Database schema definition
```

## 🔧 Development Environment

### Quick Start

```bash
# Start development environment
./scripts/docker/dev-up.sh

# Stop development environment
./scripts/docker/dev-down.sh

# Stop with cleanup
./scripts/docker/dev-down.sh --full
```

### Services Included

- **PostgreSQL 15**: Primary database
  - Port: 5432
  - Database: exchanger_dev
  - User: exchanger
  - Admin interface: pgAdmin at http://localhost:5050

- **Redis 7**: Session storage and caching
  - Port: 6379
  - Admin interface: Redis Commander at http://localhost:8081

- **pgAdmin**: Database administration
  - URL: http://localhost:5050
  - Email: admin@exchanger.local
  - Password: admin

- **Redis Commander**: Redis administration
  - URL: http://localhost:8081

### Development Scripts

#### `dev-up.sh`

```bash
# Basic startup
./scripts/docker/dev-up.sh

# Skip database initialization
./scripts/docker/dev-up.sh --skip-init

# Recreate containers
./scripts/docker/dev-up.sh --recreate

# Show help
./scripts/docker/dev-up.sh --help
```

#### `dev-down.sh`

```bash
# Stop containers only
./scripts/docker/dev-down.sh

# Remove volumes (deletes all data)
./scripts/docker/dev-down.sh --volumes

# Complete cleanup
./scripts/docker/dev-down.sh --full
```

## 🚀 Production Environment

### Prerequisites

1. **Environment File**: Create `.env.production` from `.env.production.example`
2. **Strong Passwords**: Ensure all passwords are at least 12 characters
3. **Root Access**: Run deployment scripts as root for proper permissions
4. **Docker**: Ensure Docker and Docker Compose are installed

### Production Deployment

```bash
# Deploy production environment
sudo ./scripts/docker/prod-deploy.sh

# Deploy with help
./scripts/docker/prod-deploy.sh --help

# Deploy without backup
sudo ./scripts/docker/prod-deploy.sh --skip-backup
```

### Production Management

```bash
# Show service status
./scripts/docker/prod-manage.sh status

# View logs
./scripts/docker/prod-manage.sh logs --follow

# Create backup
./scripts/docker/prod-manage.sh backup

# Restart services
./scripts/docker/prod-manage.sh restart

# Enter maintenance mode
./scripts/docker/prod-manage.sh maintenance

# Scale web service
./scripts/docker/prod-manage.sh scale --service web --replicas 3
```

### Production Services

- **PostgreSQL 15**: Production database with optimizations
  - Port: 5432 (internal only)
  - Database: exchanger_prod
  - Persistent storage: `/var/lib/exchanger/postgres`

- **Redis 7**: Production session storage
  - Port: 6379 (internal only)
  - Persistent storage: `/var/lib/exchanger/redis`
  - Password protected

- **Web Application**: Next.js application
  - Port: 3000
  - Health check: `/api/health`
  - Auto-restart on failure

## 🔧 Configuration Files

### Environment Variables

#### Development (`.env.example`)

```env
# Database
DATABASE_URL="postgresql://exchanger:password@localhost:5432/exchanger_dev"
POSTGRES_DB=exchanger_dev
POSTGRES_USER=exchanger
POSTGRES_PASSWORD=password

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-key"
```

#### Production (`.env.production.example`)

```env
# Database
DATABASE_URL="postgresql://exchanger:STRONG_PASSWORD@postgres:5432/exchanger_prod"
POSTGRES_DB=exchanger_prod
POSTGRES_USER=exchanger
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE

# Redis
REDIS_URL="redis://:REDIS_PASSWORD@redis:6379"
REDIS_PASSWORD=STRONG_REDIS_PASSWORD

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="VERY_STRONG_SECRET_AT_LEAST_32_CHARS"

# Production settings
NODE_ENV=production
```

### Docker Compose

#### Development (`docker-compose.yml`)

- Includes development tools (pgAdmin, Redis Commander)
- Uses development optimizations
- Exposes all ports for debugging
- Includes volume mounts for hot reloading

#### Production (`docker-compose.production.yml`)

- Security hardened
- Performance optimized
- No debug tools exposed
- Proper health checks
- Resource limits

## 📊 Monitoring and Maintenance

### Health Checks

The production environment includes automated health checks:

```bash
# Manual health check
/etc/exchanger/health-check.sh

# View health logs
tail -f /var/log/exchanger/alerts.log
```

### Backup Strategy

Automated backups include:

- PostgreSQL database dump
- Redis data export
- Configuration files
- Backup metadata

```bash
# Create manual backup
./scripts/docker/prod-manage.sh backup

# Restore from backup
./scripts/docker/prod-manage.sh restore --backup-dir /path/to/backup

# List available backups
ls -la /var/backups/exchanger/
```

### Log Management

```bash
# View all logs
docker-compose -f docker-compose.production.yml logs -f

# View specific service logs
docker-compose -f docker-compose.production.yml logs -f web
docker-compose -f docker-compose.production.yml logs -f postgres
docker-compose -f docker-compose.production.yml logs -f redis

# View last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100
```

## 🔒 Security Considerations

### Production Security

1. **Passwords**: Use strong, unique passwords for all services
2. **Network**: Services communicate internally, minimal external exposure
3. **Volumes**: Proper file permissions and ownership
4. **Updates**: Regular security updates for base images
5. **Monitoring**: Automated health checks and alerting

### Firewall Configuration

```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw deny 5432   # PostgreSQL (internal only)
ufw deny 6379   # Redis (internal only)
```

## 🚨 Troubleshooting

### Common Issues

#### Services Not Starting

```bash
# Check service status
./scripts/docker/prod-manage.sh status

# View logs for errors
./scripts/docker/prod-manage.sh logs --service <service-name>

# Restart specific service
./scripts/docker/prod-manage.sh restart --service <service-name>
```

#### Database Connection Issues

```bash
# Test PostgreSQL connection
docker-compose -f docker-compose.production.yml exec postgres pg_isready -U exchanger

# Check database logs
docker-compose -f docker-compose.production.yml logs postgres

# Connect to database for debugging
docker-compose -f docker-compose.production.yml exec postgres psql -U exchanger -d exchanger_prod
```

#### Redis Connection Issues

```bash
# Test Redis connection
docker-compose -f docker-compose.production.yml exec redis redis-cli ping

# Check Redis logs
docker-compose -f docker-compose.production.yml logs redis

# Connect to Redis for debugging
docker-compose -f docker-compose.production.yml exec redis redis-cli
```

#### Performance Issues

```bash
# Check resource usage
docker stats

# View system resources
htop
df -h
free -h

# Scale services if needed
./scripts/docker/prod-manage.sh scale --service web --replicas 3
```

### Emergency Procedures

#### Complete System Recovery

```bash
# 1. Stop all services
./scripts/docker/prod-manage.sh stop

# 2. Restore from latest backup
./scripts/docker/prod-manage.sh restore --backup-dir /var/backups/exchanger/latest

# 3. Start services
./scripts/docker/prod-manage.sh restart

# 4. Verify functionality
./scripts/docker/prod-manage.sh status
```

#### Maintenance Mode

```bash
# Enter maintenance mode
./scripts/docker/prod-manage.sh maintenance

# Perform maintenance tasks
# ...

# Exit maintenance mode
docker stop maintenance-page && docker rm maintenance-page
./scripts/docker/prod-manage.sh restart --service web
```

## 📈 Performance Optimization

### Database Optimization

- Connection pooling configured
- Proper indexing in schema
- Regular VACUUM and ANALYZE operations
- Optimized PostgreSQL settings for production

### Redis Optimization

- Memory optimization settings
- Persistence configuration
- Eviction policies configured
- Connection limits set appropriately

### Application Optimization

- Health checks prevent failed requests
- Auto-restart on application failure
- Resource limits prevent resource exhaustion
- Horizontal scaling support

## 🔄 Updates and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Review logs and health checks
2. **Monthly**: Update base Docker images
3. **Quarterly**: Security audit and backup testing
4. **As needed**: Scale services based on load

### Update Procedures

```bash
# Update all services
./scripts/docker/prod-manage.sh update

# Update specific service
docker-compose -f docker-compose.production.yml pull <service>
docker-compose -f docker-compose.production.yml up -d <service>
```

This Docker infrastructure provides a robust, scalable, and secure environment for both development and production deployments of the Exchanger application.
