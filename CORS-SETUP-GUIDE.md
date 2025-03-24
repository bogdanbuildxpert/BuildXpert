# Cross-Domain Authentication Setup Guide for BuildXpert

This guide will help you implement cross-domain authentication on your Digital Ocean droplet for the BuildXpert application.

## Prerequisites

- SSH access to your Digital Ocean droplet
- Sudo/root privileges
- Nginx installed on your droplet
- Let's Encrypt SSL certificates for your domain
- Your application running with PM2 or similar process manager

## Step 1: Prepare the Configuration Files

Connect to your Digital Ocean droplet via SSH:

```bash
ssh root@your-droplet-ip
```

Navigate to your application directory:

```bash
cd /root/BuildXpert
```

Create the necessary directories and files:

```bash
# Create nginx directory
mkdir -p nginx

# Create the setup script directory
mkdir -p scripts
```

## Step 2: Upload the Configuration Files

Using SCP or another file transfer method, upload the following files to your droplet:

1. `nginx/buildxpert.conf` - Nginx configuration with CORS support
2. `scripts/setup-cors.sh` - Setup script to configure CORS
3. `lib/fetch-util.ts` - Utility functions for authenticated fetch requests

You can also create these files directly on the server using a text editor like nano or vim.

## Step 3: Make the Setup Script Executable

```bash
chmod +x scripts/setup-cors.sh
```

## Step 4: Run the Setup Script

```bash
sudo ./scripts/setup-cors.sh
```

The script will:

- Create the proper Nginx configuration
- Set up CORS headers for cross-domain requests
- Configure your environment variables
- Restart Nginx and your application

## Step 5: Verify the Configuration

### Check Nginx Configuration

```bash
nginx -t
```

This should return:

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Check CORS Headers

Use curl to check if CORS headers are correctly set:

```bash
curl -I -H "Origin: http://localhost:3000" https://buildxpert.ie/api/auth/check
```

You should see headers like:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

## Step 6: Update Client Code

On your local development environment, update your fetch calls to use the new `fetchWithAuth` utility:

```typescript
import { fetchWithAuth, fetchJsonWithAuth } from "@/lib/fetch-util";

// Use fetchWithAuth for any API calls
const response = await fetchWithAuth("/api/auth/check", {
  method: "GET",
});

// Or use fetchJsonWithAuth for JSON responses
const data = await fetchJsonWithAuth("/api/endpoint");
```

## Troubleshooting

### CORS Headers Not Working

If CORS headers aren't being sent:

1. Check if Nginx is running:

   ```bash
   systemctl status nginx
   ```

2. Check Nginx error logs:
   ```bash
   tail -f /var/log/nginx/error.log
   ```

### Authentication Issues

If you're having authentication issues:

1. Check that cookies are being set with proper attributes:

   - Open browser developer tools
   - Go to Application/Storage tab
   - Check cookies for your domain
   - Verify they have proper SameSite and Secure attributes

2. Verify credentials are being included:
   - Check Network tab in developer tools
   - Verify that requests have the "include credentials" flag

## Additional Resources

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [NextAuth.js Cross-Domain Guide](https://next-auth.js.org/configuration/options#cookies)

## Security Considerations

- Always use HTTPS for cross-domain authentication
- Limit the allowed origins to trusted domains
- Use secure, HttpOnly cookies when possible
- Implement proper CSRF protection

For additional help, please contact your system administrator or the BuildXpert development team.
