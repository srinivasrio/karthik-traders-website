#!/bin/bash
# vps_restore_nginx.sh
# Run this on your VPS as root: sudo bash vps_restore_nginx.sh

echo "======================================================="
# 1. Write the Nginx configuration
echo "1. Recreating Nginx configuration file..."
cat << 'EOF' > /etc/nginx/sites-available/karthiktraders
server {
    listen 80;
    server_name karthiktraders.in www.karthiktraders.in;

    # Root points to the public folder where maintenance.html and assets reside
    root /var/www/karthik-traders-website/public;

    # Check if the maintenance trigger file exists
    if (-f /var/www/karthik-traders-website/maintenance.enable) {
        set $maintenance on;
    }

    # Bypass maintenance check for static files (so images, logos, CSS render correctly)
    if ($request_uri ~* \.(gif|jpg|jpeg|png|css|js|ico|svg|woff|woff2)$) {
        set $maintenance off;
    }

    # Bypass maintenance check for Supabase API routes (database, auth, storage)
    if ($request_uri ~* ^/(rest|auth|storage)/) {
        set $maintenance off;
    }

    # If maintenance mode is active, trigger a 503 error
    if ($maintenance = on) {
        return 503;
    }

    # Define where to serve the 503 maintenance page
    error_page 503 @maintenance;
    location @maintenance {
        root /var/www/karthik-traders-website/public;
        rewrite ^(.*)$ /maintenance.html break;
    }

    # Normal reverse proxy to your running Next.js app (PM2 port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 2. Re-create symlink if missing
echo "2. Checking symlink..."
ln -sf /etc/nginx/sites-available/karthiktraders /etc/nginx/sites-enabled/karthiktraders

# 3. Restore SSL with Certbot
echo "3. Running Certbot to configure SSL..."
certbot --nginx -d karthiktraders.in -d www.karthiktraders.in --redirect --keep-until-expiring

# 4. Verify & reload Nginx
echo "4. Testing and reloading Nginx..."
nginx -t && systemctl reload nginx

echo "======================================================="
echo "🎉 Restored Successfully! Both sites are running."
echo "======================================================="
