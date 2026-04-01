# VPS Status and Security Report

Generated on: 2026-04-01
Last deployment update: 2026-04-01T13:35Z

## 1. Deployment Summary

- Application deployed to VPS: `103.14.120.237`
- Hostname: `server.calvis`
- Operating system: `Ubuntu 24.04.4 LTS`
- Public entry URL: `http://103.14.120.237`
- App directory: `/var/www/real-estate-production-test`
- Reverse proxy: `nginx`
- Process manager: `pm2`
- Database: `PostgreSQL 16`
- Latest deployed app commit: `82cd4a4`
- Deployment method currently used: archive upload and in-place extract (server app directory is not a Git checkout)

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
- Applied latest security hardening deployment (`82cd4a4`)
- Restarted PM2 apps under `realestate` user and saved process list

## 4. Application Notes

- Frontend is served through Nginx on port `80`
- Backend listens on port `8081` internally and is proxied through `/api/*`
- Public property API currently returns only `ACTIVE` listings to unauthenticated users
- CRM admin login is working through the deployed stack
- Database schema was applied using Drizzle
- Mock data has been seeded into the live VPS database for demo/testing use
- Login over HTTP was fixed by disabling `Secure` cookies for the current non-HTTPS deployment
- Language toggle and Tamil i18n home page integration are live
- Frontend and backend production builds succeeded during latest deployment

## 5. Security Report

### Positive Security Controls Already in Place

- Backend is behind Nginx
- UFW firewall is enabled
- Direct public access is intended to go through Nginx
- JWT secret is required in production configuration
- Admin-only routes now require an authenticated admin token
- Public properties endpoint no longer exposes hidden and archived listings by default
- Backend login cookies now work correctly for the current HTTP-only deployment
- Global and route-level rate limiting are enabled (`/api`, auth, public form submission, and admin write paths)
- CSRF protection is enabled for admin state-changing routes
- Backend payload validation is enabled for leads, contacts, and listing requests
- Backend and frontend HTML sanitization are using stronger libraries (`sanitize-html` and `dompurify`)
- Admin login now supports bcrypt hash verification and auto-upgrades legacy plain-text admin passwords on successful login

### Security Risks Still Present

#### High Priority

- The VPS `root` password was shared in chat and should be rotated immediately
- The deployment is still HTTP only and does not yet have TLS/HTTPS
- Cloudinary secrets and app secrets live in env files on the VPS, so file permissions should be reviewed carefully

#### Medium Priority

- No fail2ban or brute-force SSH protection has been configured yet
- SSH login is still using the `root` account
- No separate non-root deployment workflow has been set up beyond the runtime user
- No backup automation has been configured for PostgreSQL or uploaded media references
- No monitoring or alerting stack is configured yet
- Legacy admin records that have never logged in since bcrypt rollout may still be plain text until first successful login (migration is lazy-upgrade)

#### Lower Priority / Operational Risks

- A newer Ubuntu kernel is available, so a planned reboot is recommended
- No SSL certificate is installed yet
- No domain has been configured yet
- The deployment directory is not a Git checkout, which makes `git pull`-based deploys unavailable until workflow is standardized

## 6. Recommended Immediate Next Steps

### Critical

1. Rotate the VPS `root` password.
2. Change the temporary CRM admin password.
3. Attach the real domain and enable HTTPS with Let's Encrypt.
4. Re-enable secure cookies after HTTPS is enabled.
5. Confirm all admin users have logged in once post-rollout so legacy plain-text records are upgraded to bcrypt hashes.

### Strongly Recommended

1. Create a non-root SSH admin user and disable direct root login.
2. Move SSH auth to keys only.
3. Install and configure `fail2ban`.
4. Add PostgreSQL backups.
5. Add PM2 log rotation and basic uptime monitoring.
6. Standardize deployments to a Git checkout or CI/CD pipeline instead of archive upload.

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

This VPS is hosting the latest code successfully, PM2 services are online, and security posture is improved with rate limiting, CSRF checks, request validation, and stronger sanitization. It is still not fully production-hardened until root credentials are rotated, HTTPS is enabled, SSH is hardened, and backup/monitoring workflows are in place.
