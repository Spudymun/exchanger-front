#!/bin/bash

# ✅ Development Docker Environment Teardown Script
# This script stops and cleans up the development environment

set -e

echo "🛑 Stopping Exchanger Development Environment..."

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

# Parse command line arguments
CLEANUP_VOLUMES=false
CLEANUP_IMAGES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --volumes)
            CLEANUP_VOLUMES=true
            shift
            ;;
        --images)
            CLEANUP_IMAGES=true
            shift
            ;;
        --full)
            CLEANUP_VOLUMES=true
            CLEANUP_IMAGES=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --volumes    Remove Docker volumes (deletes all data)"
            echo "  --images     Remove Docker images"
            echo "  --full       Remove both volumes and images"
            echo "  -h, --help   Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Stop containers only"
            echo "  $0 --volumes          # Stop containers and remove volumes"
            echo "  $0 --full             # Complete cleanup"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Stop containers
stop_containers() {
    print_status "Stopping Docker containers..."
    
    if docker-compose ps -q | grep -q .; then
        docker-compose down --remove-orphans
        print_success "Containers stopped"
    else
        print_warning "No running containers found"
    fi
}

# Remove volumes
remove_volumes() {
    if [ "$CLEANUP_VOLUMES" = true ]; then
        print_warning "Removing Docker volumes (this will delete all data)..."
        read -p "Are you sure? This will delete all database and Redis data. (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down --volumes
            print_success "Volumes removed"
        else
            print_status "Volume removal cancelled"
        fi
    fi
}

# Remove images
remove_images() {
    if [ "$CLEANUP_IMAGES" = true ]; then
        print_status "Removing Docker images..."
        
        # Remove project-specific images
        docker images | grep -E "(postgres|redis|pgadmin|rediscommander)" | awk '{print $3}' | xargs -r docker rmi -f
        
        # Clean up dangling images
        docker image prune -f
        
        print_success "Images removed"
    fi
}

# Show final status
show_status() {
    print_status "Final Status:"
    echo ""
    
    # Check if any containers are still running
    RUNNING_CONTAINERS=$(docker-compose ps -q 2>/dev/null | wc -l)
    
    if [ "$RUNNING_CONTAINERS" -eq 0 ]; then
        print_success "All containers stopped"
    else
        print_warning "Some containers may still be running:"
        docker-compose ps
    fi
    
    echo ""
    print_status "To restart the development environment:"
    echo "  ./scripts/docker/dev-up.sh"
    echo ""
    
    if [ "$CLEANUP_VOLUMES" = true ]; then
        print_warning "Volumes were removed - you'll need to set up the database again"
    fi
}

# Main execution
main() {
    print_status "🐳 Exchanger Development Environment Teardown"
    echo "=============================================="
    
    stop_containers
    remove_volumes
    remove_images
    show_status
    
    print_success "🏁 Development environment teardown completed!"
}

# Handle script interruption
trap 'print_error "Teardown interrupted"; exit 1' INT

# Run main function
main "$@"
