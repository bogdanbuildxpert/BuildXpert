#!/bin/bash

# Script to set up CORS for cross-domain authentication on a Digital Ocean droplet
# Run this script with sudo permissions

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

echo "Setting up CORS for cross-domain authentication..."

# Define variables - update these with your specific values
APP_DOMAIN="yourdomain.com"
NODE_PORT="3000"
APP_DIR="/path/to/your/app" # Replace with your application directory

# 1. Create nginx config directory if it doesn't exist
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

# 2. Copy nginx configuration
echo "Creating nginx configuration..."
cp $APP_DIR/nginx/buildxpert.conf /etc/nginx/sites-available/buildxpert.conf

# 3. Replace placeholder domain with actual domain
sed -i "s/yourdomain.com/$APP_DOMAIN/g" /etc/nginx/sites-available/buildxpert.conf

# 4. Enable the site
if [ ! -L /etc/nginx/sites-enabled/buildxpert.conf ]; then
  ln -s /etc/nginx/sites-available/buildxpert.conf /etc/nginx/sites-enabled/
fi

# 5. Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

if [ $? -ne 0 ]; then
  echo "Nginx configuration test failed. Please check the errors above."
  exit 1
fi

# 6. Restart nginx
echo "Restarting nginx..."
systemctl restart nginx

# 7. Update environment variables
echo "Updating environment variables..."
cd $APP_DIR

# Add or update NEXT_PUBLIC_APP_URL in .env file
if grep -q "NEXT_PUBLIC_APP_URL" .env; then
  sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://$APP_DOMAIN|g" .env
else
  echo "NEXT_PUBLIC_APP_URL=https://$APP_DOMAIN" >> .env
fi

# Add or update CORS_ALLOWED_ORIGINS in .env file
if grep -q "CORS_ALLOWED_ORIGINS" .env; then
  sed -i "s|CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=https://$APP_DOMAIN,https://www.$APP_DOMAIN|g" .env
else
  echo "CORS_ALLOWED_ORIGINS=https://$APP_DOMAIN,https://www.$APP_DOMAIN" >> .env
fi

# 8. Restart the application
echo "Restarting your application..."
if command -v pm2 &> /dev/null; then
  pm2 restart all
else
  echo "PM2 not found. Please restart your application manually."
fi

echo "CORS setup complete! Your server should now support cross-domain authentication."
echo "Make sure your SSL certificates are properly set up for HTTPS."
echo ""
echo "To verify, check:"
echo "1. Response headers include Access-Control-Allow-Credentials: true"
echo "2. Cookies are set with SameSite=None; Secure attributes"
echo "3. API requests include credentials: 'include'"
echo ""
echo "You can test cross-domain authentication by visiting your site from a different domain/localhost." 