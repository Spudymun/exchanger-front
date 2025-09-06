#!/bin/bash

# ✅ Development Docker Environment Setup Script
# This script initializes the complete development environment

set -e

echo "🚀 Setting up Exchanger Development Environment..."

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

# Check if Docker is running
check_docker() {
    print_status "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if .env file exists
check_env() {
    print_status "Checking environment configuration..."
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_success "Created .env file from template"
        print_warning "Please review and update .env file with your settings"
    else
        print_success ".env file exists"
    fi
}

# Stop any existing containers
cleanup_existing() {
    print_status "Cleaning up existing containers..."
    docker-compose down --remove-orphans || true
    print_success "Cleanup completed"
}

# Start the development environment
start_development() {
    print_status "Starting development environment..."
    
    # Start core services (postgres, redis)
    print_status "Starting core services (PostgreSQL, Redis)..."
    docker-compose up -d postgres redis
    
    # Wait for services to be healthy
    print_status "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL..."
    until docker-compose exec postgres pg_isready -U exchanger_user -d exchanger_db > /dev/null 2>&1; do
        printf '.'
        sleep 2
    done
    echo ""
    print_success "PostgreSQL is ready"
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    until docker-compose exec redis redis-cli ping > /dev/null 2>&1; do
        printf '.'
        sleep 1
    done
    echo ""
    print_success "Redis is ready"
    
    # Start development tools
    print_status "Starting development tools..."
    docker-compose --profile development up -d
    
    print_success "Development environment is ready!"
}

# Run database migrations
setup_database() {
    print_status "Setting up database..."
    
    # Check if we need to run Prisma migrations
    if [ -d "packages/session-management/prisma" ]; then
        print_status "Running Prisma database setup..."
        cd packages/session-management
        
        # Generate Prisma client
        npx prisma generate
        
        # Push database schema
        npx prisma db push
        
        cd ../..
        print_success "Database setup completed"
    else
        print_warning "Prisma directory not found, skipping database setup"
    fi
}

# Show service status
show_status() {
    print_status "Service Status:"
    echo ""
    docker-compose ps
    echo ""
    
    print_status "Available Services:"
    echo "🗄️  PostgreSQL: localhost:5432"
    echo "🔴 Redis: localhost:6379"
    echo "🔧 PgAdmin: http://localhost:8080 (admin@exchanger.local / admin123)"
    echo "🔧 Redis Commander: http://localhost:8081 (admin / admin123)"
    echo ""
    
    print_status "Database Connection:"
    echo "Host: localhost"
    echo "Port: 5432"
    echo "Database: exchanger_db"
    echo "Username: exchanger_user"
    echo "Password: exchanger_password"
    echo ""
    
    print_status "Next Steps:"
    echo "1. Update your .env file if needed"
    echo "2. Run 'npm run dev' to start the development server"
    echo "3. Access PgAdmin at http://localhost:8080 to manage the database"
    echo "4. Access Redis Commander at http://localhost:8081 to monitor Redis"
}

# Main execution
main() {
    print_status "🐳 Exchanger Development Environment Setup"
    echo "=========================================="
    
    check_docker
    check_env
    cleanup_existing
    start_development
    setup_database
    show_status
    
    print_success "🎉 Development environment setup completed!"
    print_status "Run './scripts/docker/dev-down.sh' to stop the environment"
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT

# Run main function
main "$@"
