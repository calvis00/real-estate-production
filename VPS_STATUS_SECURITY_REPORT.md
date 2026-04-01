# VPS Status and Security Report

Generated on: 2026-04-01

## 1. Deployment Summary

- Application deployed to VPS: `103.14.120.237`
- Hostname: `server.calvis`
- Operating system: `Ubuntu 24.04.4 LTS`
- Public entry URL: `http://103.14.120.237`
- App directory: `/var/www/real-estate-production-test`
- Reverse proxy: `nginx`
- Process manager: `pm2`
- Database: `PostgreSQL 16`

## 2. Current VPS Status

### Server Health

- Server time at check: `2026-04-01T10:23:02+00:00`
- Uptime at check: `up 1:43`
- Root filesystem usage: `5.0G / 48G` used, `40G` available
- Memory usage: `715Mi / 3.8Gi`
- Swap usage: `780Ki / 2.0Gi`

### Installed Runtime Versions

- Node.js: `v22.22.2`
- npm: `10.9.7`
- PostgreSQL: `16.13`
- Nginx: `1.24.0`

### Service Status

- `nginx`: `active`
- `postgresql`: `active`
- `pm2` apps:
  - `real-estate-backend`: `online`
  - `real-estate-frontend`: `online`

### HTTP Verification

- `http://127.0.0.1:3000` responded with `200 OK`
- `http://127.0.0.1:8081/health` responded with healthy JSON
- `http://127.0.0.1` through Nginx responded with `200 OK`
- `http://103.14.120.237` responded publicly
- `http://103.14.120.237/health` responded publicly through Nginx

### Live Data Status

- Public properties currently seeded: `6`
- CRM leads currently seeded: `4`
- CRM contacts currently seeded: `3`
- CRM listing requests currently seeded: `3`

### Firewall Status

`ufw` is enabled with default deny for incoming traffic.

Allowed inbound ports:

- `2244/tcp` for SSH
- `80/tcp` for HTTP
- `443/tcp` for HTTPS

## 3. Deployment Actions Completed

- Installed Node.js, npm, PostgreSQL, Nginx, PM2, and UFW
- Created Linux app user: `realestate`
- Created PostgreSQL database for the app
- Deployed source code to `/var/www/real-estate-production-test`
- Wrote production env files on the VPS
- Built backend and frontend in production mode
- Started both services under PM2
- Configured Nginx reverse proxy
- Enabled PM2 startup on boot
- Enabled firewall rules for SSH, HTTP, and HTTPS

## 4. Application Notes

- Frontend is served through Nginx on port `80`
- Backend listens on port `8081` internally and is proxied through `/api/*`
- Public property API currently returns only `ACTIVE` listings to unauthenticated users
- CRM admin login is working through the deployed stack
- Database schema was applied using Drizzle
- Mock data has been seeded into the live VPS database for demo/testing use
- Login over HTTP was fixed by disabling `Secure` cookies for the current non-HTTPS deployment

## 5. Security Report

### Positive Security Controls Already in Place

- Backend is behind Nginx
- UFW firewall is enabled
- Direct public access is intended to go through Nginx
- JWT secret is required in production configuration
- Admin-only routes now require an authenticated admin token
- Public properties endpoint no longer exposes hidden and archived listings by default
- Backend login cookies now work correctly for the current HTTP-only deployment

### Security Risks Still Present

#### High Priority

- The VPS `root` password was shared in chat and should be rotated immediately
- The app currently uses plain-text password comparison for admin login
- The deployment is still HTTP only and does not yet have TLS/HTTPS
- Cloudinary secrets and app secrets live in env files on the VPS, so file permissions should be reviewed carefully

#### Medium Priority

- No fail2ban or brute-force SSH protection has been configured yet
- SSH login is still using the `root` account
- No separate non-root deployment workflow has been set up beyond the runtime user
- No backup automation has been configured for PostgreSQL or uploaded media references
- No monitoring or alerting stack is configured yet

#### Lower Priority / Operational Risks

- A newer Ubuntu kernel is available, so a planned reboot is recommended
- No SSL certificate is installed yet
- No domain has been configured yet
- The application currently has no rate limiting on public form endpoints
- The admin password should be moved to hashed storage as soon as possible

## 6. Recommended Immediate Next Steps

### Critical

1. Rotate the VPS `root` password.
2. Change the temporary CRM admin password.
3. Attach the real domain and enable HTTPS with Let's Encrypt.
4. Replace plain-text admin password handling with `bcrypt`.
5. Re-enable secure cookies after HTTPS is enabled.

### Strongly Recommended

1. Create a non-root SSH admin user and disable direct root login.
2. Move SSH auth to keys only.
3. Install and configure `fail2ban`.
4. Add PostgreSQL backups.
5. Add PM2 log rotation and basic uptime monitoring.

## 7. Sensitive Data Handling Note

This report intentionally does not store active secrets, passwords, database credentials, JWT secrets, or Cloudinary secrets in the repository. Those values were configured on the VPS during deployment and should be rotated if they were exposed during setup.

## 8. Important Paths on the VPS

- App root: `/var/www/real-estate-production-test`
- Backend env file: `/var/www/real-estate-production-test/backend/.env`
- Frontend env file: `/var/www/real-estate-production-test/frontend/.env.production`
- Nginx site config: `/etc/nginx/sites-available/real-estate`
- PM2 home: `/home/realestate/.pm2`

## 9. Overall Assessment

Current state: `Deployed and operational for testing / controlled use`

This VPS is now hosting the application successfully, the core stack is running correctly, and demo data is available for presentation/testing. It is not yet fully hardened for long-term production use until password handling, HTTPS, SSH hardening, and backup/monitoring are completed.
