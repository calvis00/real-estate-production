# VPS Deployment Guide

## 1. Prepare the server

- Rotate the VPS root password because it was shared in chat.
- Create a non-root sudo user for app management.
- Point your domain and subdomain DNS to the VPS IP.
- Install Node.js 22, npm, PostgreSQL, Nginx, and PM2.

## 2. Backend environment

Create `backend/.env` from `backend/.env.example` and set:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## 3. Frontend environment

Create `frontend/.env.production` from `frontend/.env.example` and set:

- `NEXT_PUBLIC_API_URL=https://api.your-domain.com`

## 4. Build and run

Backend:

```powershell
cd backend
npm install
npm run build
pm2 start dist/index.js --name real-estate-backend
```

Frontend:

```powershell
cd frontend
npm install
npm run build
pm2 start npm --name real-estate-frontend -- start
```

## 5. Reverse proxy

- Route `your-domain.com` to the Next.js app on port `3000`.
- Route `api.your-domain.com` to the Express app on port `8081`.
- Enable HTTPS with Let's Encrypt.

## 6. Final checks

- Confirm admin login works with a real `JWT_SECRET`.
- Confirm public listings only show `ACTIVE` properties.
- Confirm CRM pages can read/write data with cookies enabled.
- Confirm lead forms save both `budgetMin` and `budgetMax`.
