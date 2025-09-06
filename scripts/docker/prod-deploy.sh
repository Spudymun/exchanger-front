#!/bin/bash

# ✅ Production Docker Environment Deployment Script
# This script deploys the production environment with proper optimizations

set -e

echo "🚀 Deploying Exchanger Production Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if running as root (recommended for production)
    if [ "$EUID" -ne 0 ]; then
        print_warning "Not running as root. This is OK for development but not recommended for production."
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if production environment file exists
    if [ ! -f ".env.production" ]; then
        print_error "Production environment file (.env.production) not found"
        echo "Please create .env.production based on .env.production.example"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Validate environment variables
validate_environment() {
    print_status "Validating production environment variables..."
    
    # Source production environment
    set -a
    source .env.production
    set +a
    
    # Required variables
    REQUIRED_VARS=(
        "DATABASE_URL"
        "REDIS_URL"
        "NEXTAUTH_SECRET"
        "POSTGRES_DB"
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
        "REDIS_PASSWORD"
    )
    
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        printf '  %s\n' "${MISSING_VARS[@]}"
        exit 1
    fi
    
    # Validate strong passwords
    if [ ${#POSTGRES_PASSWORD} -lt 12 ]; then
        print_error "POSTGRES_PASSWORD must be at least 12 characters long"
        exit 1
    fi
    
    if [ ${#REDIS_PASSWORD} -lt 12 ]; then
        print_error "REDIS_PASSWORD must be at least 12 characters long"
        exit 1
    fi
    
    if [ ${#NEXTAUTH_SECRET} -lt 32 ]; then
        print_error "NEXTAUTH_SECRET must be at least 32 characters long"
        exit 1
    fi
    
    print_success "Environment validation passed"
}

# Setup production directories
setup_directories() {
    print_status "Setting up production directories..."
    
    # Create data directories with proper permissions
    sudo mkdir -p /var/lib/exchanger/{postgres,redis}
    sudo mkdir -p /var/log/exchanger
    sudo mkdir -p /etc/exchanger
    
    # Set ownership and permissions
    sudo chown -R 999:999 /var/lib/exchanger/postgres  # PostgreSQL user
    sudo chown -R 999:999 /var/lib/exchanger/redis     # Redis user
    sudo chmod 700 /var/lib/exchanger/postgres
    sudo chmod 700 /var/lib/exchanger/redis
    
    print_success "Production directories created"
}

# Deploy with zero downtime
deploy_zero_downtime() {
    print_status "Performing zero-downtime deployment..."
    
    # Pull latest images
    docker-compose -f docker-compose.production.yml pull
    
    # Create new containers without stopping old ones
    docker-compose -f docker-compose.production.yml up -d --no-deps --scale postgres=1 --scale redis=1
    
    # Wait for health checks
    print_status "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f docker-compose.production.yml ps | grep -q "healthy"; then
            print_success "Services are healthy"
            break
        fi
        
        print_status "Attempt $attempt/$max_attempts - waiting for services..."
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Services failed to become healthy within timeout"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for PostgreSQL to be ready
    docker-compose -f docker-compose.production.yml exec postgres pg_isready -U $POSTGRES_USER
    
    # Run Prisma migrations
    docker-compose -f docker-compose.production.yml exec web npx prisma migrate deploy
    
    print_success "Database migrations completed"
}

# Setup monitoring and alerts
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create monitoring scripts
    cat > /etc/exchanger/health-check.sh << 'EOF'
#!/bin/bash
# Health check script for production monitoring

SERVICES=("postgres" "redis" "web")
ALERTS_FILE="/var/log/exchanger/alerts.log"

for service in "${SERVICES[@]}"; do
    if ! docker-compose -f docker-compose.production.yml ps | grep -q "$service.*healthy"; then
        echo "$(date): ALERT - Service $service is unhealthy" >> $ALERTS_FILE
        # Add your alerting mechanism here (email, Slack, etc.)
    fi
done
EOF

    chmod +x /etc/exchanger/health-check.sh
    
    # Setup cron job for health checks
    (crontab -l 2>/dev/null; echo "*/5 * * * * /etc/exchanger/health-check.sh") | crontab -
    
    print_success "Monitoring setup completed"
}

# Backup current state
create_backup() {
    print_status "Creating backup of current state..."
    
    BACKUP_DIR="/var/backups/exchanger/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > "$BACKUP_DIR/database.sql"
    
    # Backup Redis
    docker-compose -f docker-compose.production.yml exec -T redis redis-cli --rdb - > "$BACKUP_DIR/redis.rdb"
    
    # Backup configuration
    cp .env.production "$BACKUP_DIR/"
    cp docker-compose.production.yml "$BACKUP_DIR/"
    
    print_success "Backup created at $BACKUP_DIR"
}

# Show deployment status
show_status() {
    print_status "Production Deployment Status:"
    echo "================================"
    
    # Show running containers
    docker-compose -f docker-compose.production.yml ps
    
    echo ""
    print_status "Service URLs:"
    echo "  Application: http://localhost:3000"
    echo "  PostgreSQL: localhost:5432"
    echo "  Redis: localhost:6379"
    
    echo ""
    print_status "Logs:"
    echo "  View logs: docker-compose -f docker-compose.production.yml logs -f"
    echo "  Application logs: docker-compose -f docker-compose.production.yml logs -f web"
    echo "  Database logs: docker-compose -f docker-compose.production.yml logs -f postgres"
    echo "  Redis logs: docker-compose -f docker-compose.production.yml logs -f redis"
    
    echo ""
    print_status "Management:"
    echo "  Health check: /etc/exchanger/health-check.sh"
    echo "  Monitoring: tail -f /var/log/exchanger/alerts.log"
    echo "  Backups: ls -la /var/backups/exchanger/"
}

# Main deployment function
main() {
    print_status "🐳 Exchanger Production Deployment"
    echo "===================================="
    
    check_prerequisites
    validate_environment
    create_backup
    setup_directories
    deploy_zero_downtime
    run_migrations
    setup_monitoring
    show_status
    
    print_success "🎉 Production deployment completed successfully!"
    print_warning "Remember to:"
    echo "  1. Configure your reverse proxy (nginx/Apache)"
    echo "  2. Set up SSL certificates"
    echo "  3. Configure firewall rules"
    echo "  4. Set up log rotation"
    echo "  5. Test all functionality"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT

# Parse command line arguments
SKIP_BACKUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-backup    Skip backup creation"
            echo "  -h, --help       Show this help message"
            echo ""
            echo "Prerequisites:"
            echo "  1. Create .env.production file"
            echo "  2. Run as root for production setup"
            echo "  3. Ensure Docker and Docker Compose are installed"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"
