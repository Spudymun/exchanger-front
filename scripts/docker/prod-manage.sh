#!/bin/bash

# ✅ Production Docker Environment Management Script
# This script manages the production environment (stop, restart, maintenance)

set -e

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

# Show usage
show_usage() {
    echo "Exchanger Production Management Script"
    echo "====================================="
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  status       Show current status of all services"
    echo "  stop         Stop all production services"
    echo "  restart      Restart all production services"
    echo "  logs         Show logs from all services"
    echo "  backup       Create a backup of database and Redis"
    echo "  restore      Restore from a backup"
    echo "  update       Update services to latest versions"
    echo "  maintenance  Enter maintenance mode"
    echo "  scale        Scale services"
    echo ""
    echo "Options:"
    echo "  --service <name>     Target specific service (postgres, redis, web)"
    echo "  --follow             Follow logs (for logs command)"
    echo "  --backup-dir <path>  Specify backup directory"
    echo "  --replicas <num>     Number of replicas (for scale command)"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 logs --service web --follow"
    echo "  $0 backup --backup-dir /custom/backup/path"
    echo "  $0 scale --service web --replicas 3"
}

# Check if production environment exists
check_production_env() {
    if [ ! -f "docker-compose.production.yml" ]; then
        print_error "Production compose file not found"
        exit 1
    fi
    
    if [ ! -f ".env.production" ]; then
        print_error "Production environment file not found"
        exit 1
    fi
}

# Show service status
show_status() {
    print_status "Production Services Status:"
    echo "============================"
    
    docker-compose -f docker-compose.production.yml ps
    
    echo ""
    print_status "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
    
    echo ""
    print_status "Health Status:"
    
    # Check PostgreSQL
    if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U $POSTGRES_USER >/dev/null 2>&1; then
        print_success "PostgreSQL: Healthy"
    else
        print_error "PostgreSQL: Unhealthy"
    fi
    
    # Check Redis
    if docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping >/dev/null 2>&1; then
        print_success "Redis: Healthy"
    else
        print_error "Redis: Unhealthy"
    fi
    
    # Check Web application
    if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        print_success "Web Application: Healthy"
    else
        print_error "Web Application: Unhealthy"
    fi
}

# Stop production services
stop_services() {
    print_warning "Stopping production services..."
    
    if [ "$TARGET_SERVICE" ]; then
        print_status "Stopping service: $TARGET_SERVICE"
        docker-compose -f docker-compose.production.yml stop "$TARGET_SERVICE"
    else
        print_status "Stopping all services..."
        docker-compose -f docker-compose.production.yml down --remove-orphans
    fi
    
    print_success "Services stopped"
}

# Restart production services
restart_services() {
    print_status "Restarting production services..."
    
    if [ "$TARGET_SERVICE" ]; then
        print_status "Restarting service: $TARGET_SERVICE"
        docker-compose -f docker-compose.production.yml restart "$TARGET_SERVICE"
    else
        print_status "Restarting all services..."
        docker-compose -f docker-compose.production.yml down --remove-orphans
        docker-compose -f docker-compose.production.yml up -d
    fi
    
    print_success "Services restarted"
}

# Show logs
show_logs() {
    local follow_flag=""
    
    if [ "$FOLLOW_LOGS" = true ]; then
        follow_flag="-f"
    fi
    
    if [ "$TARGET_SERVICE" ]; then
        print_status "Showing logs for service: $TARGET_SERVICE"
        docker-compose -f docker-compose.production.yml logs $follow_flag "$TARGET_SERVICE"
    else
        print_status "Showing logs for all services"
        docker-compose -f docker-compose.production.yml logs $follow_flag
    fi
}

# Create backup
create_backup() {
    local backup_dir="${BACKUP_DIR:-/var/backups/exchanger/$(date +%Y%m%d_%H%M%S)}"
    
    print_status "Creating backup at: $backup_dir"
    
    mkdir -p "$backup_dir"
    
    # Source production environment
    set -a
    source .env.production
    set +a
    
    # Backup database
    print_status "Backing up PostgreSQL database..."
    docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > "$backup_dir/database.sql"
    
    # Backup Redis
    print_status "Backing up Redis data..."
    docker-compose -f docker-compose.production.yml exec -T redis redis-cli --rdb - > "$backup_dir/redis.rdb"
    
    # Backup configurations
    print_status "Backing up configurations..."
    cp .env.production "$backup_dir/"
    cp docker-compose.production.yml "$backup_dir/"
    
    # Create backup metadata
    cat > "$backup_dir/backup-info.txt" << EOF
Backup created: $(date)
Database: $POSTGRES_DB
User: $POSTGRES_USER
Services backed up: postgres, redis
Configuration files: .env.production, docker-compose.production.yml
EOF
    
    print_success "Backup completed: $backup_dir"
}

# Restore from backup
restore_backup() {
    if [ -z "$BACKUP_DIR" ]; then
        print_error "Backup directory must be specified with --backup-dir"
        exit 1
    fi
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Backup directory does not exist: $BACKUP_DIR"
        exit 1
    fi
    
    print_warning "This will restore from backup and overwrite current data!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Restore cancelled"
        exit 0
    fi
    
    # Source production environment
    set -a
    source .env.production
    set +a
    
    print_status "Restoring from backup: $BACKUP_DIR"
    
    # Stop services
    docker-compose -f docker-compose.production.yml stop
    
    # Restore database
    if [ -f "$BACKUP_DIR/database.sql" ]; then
        print_status "Restoring PostgreSQL database..."
        docker-compose -f docker-compose.production.yml start postgres
        sleep 5
        docker-compose -f docker-compose.production.yml exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < "$BACKUP_DIR/database.sql"
    fi
    
    # Restore Redis
    if [ -f "$BACKUP_DIR/redis.rdb" ]; then
        print_status "Restoring Redis data..."
        docker-compose -f docker-compose.production.yml start redis
        sleep 5
        docker-compose -f docker-compose.production.yml exec -T redis redis-cli --rdb - < "$BACKUP_DIR/redis.rdb"
    fi
    
    # Start all services
    docker-compose -f docker-compose.production.yml start
    
    print_success "Restore completed"
}

# Update services
update_services() {
    print_status "Updating production services..."
    
    # Create backup before update
    create_backup
    
    # Pull latest images
    print_status "Pulling latest images..."
    docker-compose -f docker-compose.production.yml pull
    
    # Restart services with new images
    print_status "Restarting services with updated images..."
    docker-compose -f docker-compose.production.yml up -d
    
    # Run migrations if needed
    print_status "Running database migrations..."
    docker-compose -f docker-compose.production.yml exec web npx prisma migrate deploy
    
    print_success "Update completed"
}

# Enter maintenance mode
maintenance_mode() {
    print_status "Entering maintenance mode..."
    
    # Create maintenance page
    cat > /tmp/maintenance.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Maintenance - Exchanger</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }
        .container { max-width: 600px; margin: 0 auto; }
        .logo { font-size: 2em; color: #333; margin-bottom: 20px; }
        .message { font-size: 1.2em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🔧 Exchanger</div>
        <h1>Maintenance in Progress</h1>
        <p class="message">We're currently performing maintenance to improve your experience.</p>
        <p class="message">We'll be back shortly. Thank you for your patience!</p>
    </div>
</body>
</html>
EOF
    
    # Stop web service and serve maintenance page
    docker-compose -f docker-compose.production.yml stop web
    
    # Start simple nginx container for maintenance page
    docker run -d --name maintenance-page \
        -p 3000:80 \
        -v /tmp/maintenance.html:/usr/share/nginx/html/index.html:ro \
        nginx:alpine
    
    print_success "Maintenance mode activated"
    print_status "To exit maintenance mode: docker stop maintenance-page && docker rm maintenance-page"
}

# Scale services
scale_services() {
    if [ -z "$TARGET_SERVICE" ]; then
        print_error "Service must be specified with --service"
        exit 1
    fi
    
    if [ -z "$REPLICAS" ]; then
        print_error "Number of replicas must be specified with --replicas"
        exit 1
    fi
    
    print_status "Scaling $TARGET_SERVICE to $REPLICAS replicas..."
    
    docker-compose -f docker-compose.production.yml up -d --scale "$TARGET_SERVICE=$REPLICAS"
    
    print_success "Service scaled successfully"
}

# Parse command line arguments
COMMAND=""
TARGET_SERVICE=""
FOLLOW_LOGS=false
BACKUP_DIR=""
REPLICAS=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        status|stop|restart|logs|backup|restore|update|maintenance|scale)
            COMMAND="$1"
            shift
            ;;
        --service)
            TARGET_SERVICE="$2"
            shift 2
            ;;
        --follow)
            FOLLOW_LOGS=true
            shift
            ;;
        --backup-dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --replicas)
            REPLICAS="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check if command was provided
if [ -z "$COMMAND" ]; then
    print_error "No command specified"
    show_usage
    exit 1
fi

# Check production environment
check_production_env

# Source production environment variables
set -a
source .env.production
set +a

# Execute command
case $COMMAND in
    status)
        show_status
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    backup)
        create_backup
        ;;
    restore)
        restore_backup
        ;;
    update)
        update_services
        ;;
    maintenance)
        maintenance_mode
        ;;
    scale)
        scale_services
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac
