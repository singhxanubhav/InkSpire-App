import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import authRouter from './modules/auth/auth.routes';
import userRouter from './modules/users/user.routes';
import matchesRouter from './modules/matches/matches.routes';
import promptsRouter from './modules/prompts/prompts.routes';
import feedbackRouter from './modules/feedback/feedback.routes';
import progressRouter from './modules/progress/progress.routes';
import eventsRouter from './modules/events/events.routes';
import notificationsRouter from './modules/notifications/notifications.routes';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Request logging
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Body parsing with 10mb limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many requests, please try again later.', code: 'RATE_LIMIT_EXCEEDED' } }
});
app.use(limiter);

// Mount API routes
const apiRouter = express.Router();

// Placeholder for actual routes
apiRouter.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy' });
});

// Specific rate limiters
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, error: { message: 'Too many auth requests' } } });
const matchesLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: { success: false, error: { message: 'Match request limit reached' } } });
const feedbackLimiter = rateLimit({ windowMs: 24 * 60 * 60 * 1000, max: 100, message: { success: false, error: { message: 'Daily feedback limit reached' } } });
const promptsLimiter = rateLimit({ windowMs: 24 * 60 * 60 * 1000, max: 100, message: { success: false, error: { message: 'Daily prompt submission limit reached' } } });

apiRouter.use('/auth', authLimiter, authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/matches', matchesLimiter, matchesRouter);
apiRouter.use('/prompts', promptsLimiter, promptsRouter);
apiRouter.use('/feedback', feedbackLimiter, feedbackRouter);
apiRouter.use('/progress', progressRouter);
apiRouter.use('/events', eventsRouter);
apiRouter.use('/notifications', notificationsRouter);

app.use('/api', apiRouter);

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ success: false, error: { message: 'Route not found', code: 'NOT_FOUND' } });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_SERVER_ERROR'
    }
  });
});

export default app;
