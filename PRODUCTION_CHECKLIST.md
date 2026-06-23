# InkSpire Production Deployment Checklist

## Environment Variables
Ensure the following variables are set securely in your production hosting environment (e.g., Render, Railway):

### Backend (`server/.env`)
- `NODE_ENV=production`
- `PORT=8000`
- `DATABASE_URL=postgresql://<user>:<password>@<host>/inkspire?connection_limit=10&pool_timeout=10` *(Use pooled connection string for NeonDB)*
- `DIRECT_URL=postgresql://<user>:<password>@<host>/inkspire` *(Direct connection for Prisma migrations)*
- `JWT_SECRET=<strong-random-secret-key>`
- `JWT_EXPIRES_IN=1h`
- `REFRESH_TOKEN_SECRET=<strong-random-refresh-key>`
- `REFRESH_TOKEN_EXPIRES_IN=7d`
- `CLIENT_URL=https://<your-production-app-url>` *(Crucial for CORS)*
- `CLOUDINARY_CLOUD_NAME=<your-cloud-name>`
- `CLOUDINARY_API_KEY=<your-api-key>`
- `CLOUDINARY_API_SECRET=<your-api-secret>`

### Mobile (`mobile/.env`)
- `EXPO_PUBLIC_API_URL=https://<your-backend-production-url>/api`

## Database (NeonDB / PostgreSQL)
- [ ] Ensure connection pooling is active to handle serverless/edge environments without exhausting connections.
- [ ] Run `npx prisma migrate deploy` in the production CI/CD pipeline, NOT `db push`.
- [ ] Check if `schema.prisma` indexes are applied efficiently.

## Backend Deployment (Render / Railway / Fly.io)
- [ ] Set build command: `npm install && npx prisma generate && npm run build`
- [ ] Set start command: `npm run start`
- [ ] Verify CORS `origin` matches the exact URL of your hosted web/mobile entry point.
- [ ] Check that `unhandledRejection` handlers are capturing logs to your platform's logging dashboard.

## Mobile Deployment (Expo EAS)
- [ ] Verify `app.config.ts` version number and bundle ID.
- [ ] Run `eas build --platform all --profile production`
- [ ] Configure `expo-updates` strictly matching your EAS Project ID.

## Security Audit
- [ ] Verify rate limiters are active (App uses `express-rate-limit`).
- [ ] Verify helmet headers are being returned by the API.
- [ ] Verify password hashes are using standard bcrypt rounds (10-12).
