# Nginx Configuration Guide for BuildXpert on Google Cloud VM

This guide will walk you through the process of setting up Nginx with SSL on your Google Cloud VM for the BuildXpert application.

## Prerequisites

- Ubuntu server VM on Google Cloud
- Domain (buildxpert.ie) pointing to your VM's IP address
- SSH access to your VM

## Step 1: Install Nginx

```bash
# Update package lists
sudo apt update

# Install Nginx
sudo apt install nginx -y

# Start Nginx and enable it to start on boot
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status to ensure it's running
sudo systemctl status nginx
```

## Step 2: Install Certbot for SSL Certificates

```bash
# Install Certbot and the Nginx plugin
sudo apt install certbot python3-certbot-nginx -y
```

## Step 3: Configure Firewall Rules on Google Cloud

In the Google Cloud Console:

1. Go to VPC Network > Firewall
2. Create a new firewall rule:
   - Name: allow-http-https
   - Targets: All instances in the network
   - Source filters: IP ranges
   - Source IP ranges: 0.0.0.0/0
   - Protocols and ports: Select TCP, and enter ports 80,443

## Step 4: Set Up DNS Records

Ensure both buildxpert.ie and www.buildxpert.ie point to your VM's IP address by setting up A records in your domain's DNS settings.

## Step 5: Obtain SSL Certificates

```bash
# Obtain certificates for both domains
sudo certbot --nginx -d buildxpert.ie -d www.buildxpert.ie
```

Follow the prompts from Certbot. It will ask for your email address and agreement to terms of service.

## Step 6: Create Nginx Configuration

```bash
# Create a directory for your configuration files if it doesn't exist
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# Create the configuration file
sudo nano /etc/nginx/sites-available/buildxpert.conf
```

Copy and paste the Nginx configuration from `nginx/buildxpert.conf` into this file.

## Step 7: Enable the Site

```bash
# Create a symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/buildxpert.conf /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If the test is successful, reload Nginx
sudo systemctl reload nginx
```

## Step 8: Create Application Directory

```bash
# Create the directory for your application
sudo mkdir -p /var/www/buildxpert
sudo chown -R $USER:$USER /var/www/buildxpert
```

## Step 9: Set Up Automatic Renewal for SSL Certificates

Certbot automatically installs a cron job for certificate renewal, but you can test it with:

```bash
sudo certbot renew --dry-run
```

## Step 10: Deploy Your Next.js Application

Follow these steps to deploy your Next.js application:

1. Clone your repository:

   ```bash
   cd /var/www
   git clone your-github-repo buildxpert
   cd buildxpert
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the application:

   ```bash
   npm run build
   ```

4. Setup PM2 to manage your Node.js process:

   ```bash
   # Install PM2 globally
   sudo npm install -g pm2

   # Start your application with PM2
   pm2 start server.js --name buildxpert

   # Make PM2 start on boot
   pm2 startup
   # Run the command it outputs

   # Save the current PM2 configuration
   pm2 save
   ```

## Step 11: Test Your Configuration

Visit https://buildxpert.ie and https://www.buildxpert.ie in your browser. The www subdomain should redirect to the non-www domain.

## Troubleshooting

### Check Nginx Logs

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/buildxpert.error.log
sudo tail -f /var/log/nginx/buildxpert.access.log
```

### Check Application Logs

```bash
pm2 logs buildxpert
```

### Check Nginx Status

```bash
sudo systemctl status nginx
```

### Restart Services

```bash
sudo systemctl restart nginx
pm2 restart buildxpert
```

## Additional Security Recommendations

1. **Set up a Firewall with UFW**:

   ```bash
   sudo apt install ufw
   sudo ufw allow 'Nginx Full'
   sudo ufw allow OpenSSH
   sudo ufw enable
   ```

2. **Secure Nginx with Better Cipher Settings**:
   The provided configuration already includes strong cipher settings, but you may want to periodically update them based on security best practices.

3. **Set up Fail2Ban for Intrusion Prevention**:
   ```bash
   sudo apt install fail2ban
   sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
   sudo nano /etc/fail2ban/jail.local
   # Configure as needed
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```
