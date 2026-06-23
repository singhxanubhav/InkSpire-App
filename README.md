# InkSpire: The Collaborative Platform for Writers

InkSpire is a mobile platform designed to connect writers, facilitate constructive feedback, and encourage daily writing through live sprints, matchmaking, and community prompts.

## Architecture
This project is structured as a monorepo containing:
- **`mobile/`**: The React Native frontend built with Expo, NativeWind, and React Query.
- **`server/`**: The Node.js/Express backend powered by Prisma, PostgreSQL (NeonDB), and Socket.io.

## Prerequisites
- Node.js (v18+)
- PostgreSQL (or a NeonDB connection string)
- Expo CLI
- A Cloudinary account (for image uploads)

## Setup & Development

### 1. Database Setup
Ensure you have a PostgreSQL database running. Create a `.env` file in the `server/` directory and add your connection string:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/inkspire"
```

Run migrations and seed the database:
```bash
cd server
npm install
npx prisma migrate dev
npx prisma db seed
```

### 2. Start the Backend
The backend runs on port 8000 by default. Ensure your environment variables are configured.
```bash
cd server
npm run dev
```

### 3. Start the Mobile App
The mobile app connects to the backend API. Create a `.env` file in the `mobile/` directory:
```env
EXPO_PUBLIC_API_URL=http://<your-local-ip>:8000/api
```

Start the Expo development server:
```bash
cd mobile
npm install
npx expo start
```

## Production Deployment

### Backend
The backend is designed to be easily deployed to platforms like Render, Railway, or Fly.io.
1. Set the necessary environment variables (see `PRODUCTION_CHECKLIST.md`).
2. Build the project: `npm run build`.
3. Start the project: `npm run start`.
*Note: Make sure to use `npx prisma migrate deploy` during your CI/CD build step.*

### Mobile
The mobile app is configured for Expo Application Services (EAS).
1. Set up your EAS project: `eas init`.
2. Review the profiles in `mobile/eas.json`.
3. To build for production, run:
```bash
eas build --platform all --profile production
```

## Documentation
- **[API Collection](./InkSpire_API_Collection.json)**: Import this into Postman or Bruno to view all backend routes.
- **[Store Assets Guide](./STORE_ASSETS.md)**: Metadata, keywords, and description for App Store / Play Store.
- **[Production Checklist](./PRODUCTION_CHECKLIST.md)**: Final verifications before going live.
- **[Testing Checklist](./TESTING_CHECKLIST.md)**: Manual QA test cases.

## License
MIT License
