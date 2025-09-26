#!/bin/bash

# SSL Certificate Setup Script
# This script helps set up SSL certificates for the Surveying Team Management System

set -e

# Configuration
DOMAIN="your-domain.com"
EMAIL="admin@your-domain.com"
SSL_DIR="/etc/nginx/ssl"
CERTBOT_DIR="/etc/letsencrypt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

# Install certbot if not present
install_certbot() {
    if ! command -v certbot &> /dev/null; then
        log "Installing certbot..."
        
        if command -v apt-get &> /dev/null; then
            # Ubuntu/Debian
            apt-get update
            apt-get install -y certbot python3-certbot-nginx
        elif command -v yum &> /dev/null; then
            # CentOS/RHEL
            yum install -y epel-release
            yum install -y certbot python3-certbot-nginx
        else
            error "Unsupported package manager. Please install certbot manually."
        fi
    else
        log "Certbot is already installed"
    fi
}

# Create SSL directory
create_ssl_dir() {
    log "Creating SSL directory: $SSL_DIR"
    mkdir -p "$SSL_DIR"
    chmod 700 "$SSL_DIR"
}

# Generate self-signed certificates for development
generate_self_signed() {
    log "Generating self-signed certificate for development..."
    
    # Create private key
    openssl genrsa -out "$SSL_DIR/key.pem" 2048
    
    # Create certificate
    openssl req -new -x509 -key "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem" -days 365 \
        -subj "/C=UA/ST=Ukraine/L=City/O=SurveyingTeam/CN=$DOMAIN"
    
    # Set permissions
    chmod 600 "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    
    log "Self-signed certificate created successfully"
    warn "This is a self-signed certificate - browsers will show security warnings"
    warn "For production, use Let's Encrypt or purchase a commercial certificate"
}

# Setup Let's Encrypt certificate
setup_letsencrypt() {
    log "Setting up Let's Encrypt certificate for $DOMAIN"
    
    # Stop nginx to free up port 80
    log "Stopping nginx temporarily..."
    systemctl stop nginx || docker-compose -f docker-compose.prod.yml stop nginx
    
    # Get certificate
    log "Obtaining certificate from Let's Encrypt..."
    certbot certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN,www.$DOMAIN"
    
    # Copy certificates to our SSL directory
    log "Copying certificates to $SSL_DIR"
    cp "$CERTBOT_DIR/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
    cp "$CERTBOT_DIR/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
    
    # Set permissions
    chmod 600 "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    
    # Start nginx
    log "Starting nginx..."
    systemctl start nginx || docker-compose -f docker-compose.prod.yml start nginx
    
    log "Let's Encrypt certificate installed successfully"
}

# Setup certificate renewal
setup_renewal() {
    log "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > /etc/cron.d/certbot-renewal << EOF
# Renew Let's Encrypt certificates twice daily
0 */12 * * * root certbot renew --quiet --deploy-hook "systemctl reload nginx || docker-compose -f /opt/surveying-team-app/docker-compose.prod.yml restart nginx"
EOF
    
    log "Automatic renewal configured"
}

# Validate certificates
validate_certificates() {
    log "Validating SSL certificates..."
    
    if [[ ! -f "$SSL_DIR/cert.pem" ]] || [[ ! -f "$SSL_DIR/key.pem" ]]; then
        error "Certificate files not found in $SSL_DIR"
    fi
    
    # Check certificate validity
    if ! openssl x509 -in "$SSL_DIR/cert.pem" -text -noout > /dev/null 2>&1; then
        error "Invalid certificate file"
    fi
    
    # Check private key
    if ! openssl rsa -in "$SSL_DIR/key.pem" -check -noout > /dev/null 2>&1; then
        error "Invalid private key file"
    fi
    
    # Check if certificate and key match
    cert_hash=$(openssl x509 -noout -modulus -in "$SSL_DIR/cert.pem" | openssl md5)
    key_hash=$(openssl rsa -noout -modulus -in "$SSL_DIR/key.pem" | openssl md5)
    
    if [[ "$cert_hash" != "$key_hash" ]]; then
        error "Certificate and private key do not match"
    fi
    
    log "Certificate validation successful"
    
    # Display certificate info
    log "Certificate information:"
    openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:)"
}

# Test SSL configuration
test_ssl() {
    log "Testing SSL configuration..."
    
    # Test with curl if available
    if command -v curl &> /dev/null; then
        if curl -I -s --connect-timeout 10 "https://$DOMAIN" | head -1 | grep -q "200 OK"; then
            log "SSL connection test successful"
        else
            warn "SSL connection test failed - check nginx configuration"
        fi
    fi
    
    # Test certificate with openssl
    if command -v openssl &> /dev/null; then
        log "Testing certificate with OpenSSL..."
        echo | timeout 10 openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | \
        grep -E "(Verify return code:|Certificate chain)" || warn "OpenSSL test completed with warnings"
    fi
}

# Main menu
show_menu() {
    echo
    echo "SSL Certificate Setup for Surveying Team Management System"
    echo "=========================================================="
    echo
    echo "1) Generate self-signed certificate (for development)"
    echo "2) Setup Let's Encrypt certificate (for production)"
    echo "3) Validate existing certificates"
    echo "4) Setup automatic renewal"
    echo "5) Test SSL configuration"
    echo "6) Exit"
    echo
}

# Main function
main() {
    check_root
    
    # Get domain from command line or ask user
    if [[ $# -gt 0 ]]; then
        DOMAIN="$1"
        if [[ $# -gt 1 ]]; then
            EMAIL="$2"
        fi
    else
        echo -n "Enter your domain name (e.g., example.com): "
        read -r DOMAIN
        echo -n "Enter your email address: "
        read -r EMAIL
    fi
    
    if [[ -z "$DOMAIN" ]]; then
        error "Domain name is required"
    fi
    
    create_ssl_dir
    
    while true; do
        show_menu
        echo -n "Please select an option (1-6): "
        read -r choice
        
        case $choice in
            1)
                generate_self_signed
                validate_certificates
                ;;
            2)
                install_certbot
                setup_letsencrypt
                setup_renewal
                validate_certificates
                test_ssl
                ;;
            3)
                validate_certificates
                ;;
            4)
                setup_renewal
                ;;
            5)
                test_ssl
                ;;
            6)
                log "Exiting..."
                exit 0
                ;;
            *)
                warn "Invalid option. Please try again."
                ;;
        esac
        
        echo
        echo -n "Press Enter to continue..."
        read -r
    done
}

# Run main function with all arguments
main "$@"