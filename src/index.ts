import express, { Application, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import Redis from 'ioredis';
import path from 'path';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import config from './config';

// Import routes
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import userRoutes from './routes/user.routes';
import apiRoutes from './routes/api.routes';

const app: Application = express();

// Trust proxy (important for sessions behind reverse proxy)
app.set('trust proxy', 1);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../src/views'));

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development, enable in production with proper config
}));
app.use(cors());
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../src/public')));

// Redis client for session storage
const redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('✓ Redis connected'));

// Session configuration
app.use(
    session({
        store: new RedisStore({ client: redisClient }),
        secret: config.session.secret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: config.env === 'production', // HTTPS only in production
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        },
    })
);

// Make user available in all views
app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.user = req.session.user || null;
    res.locals.isAdmin = req.session.user?.is_admin || false;
    next();
});

// Routes
app.get('/', (req: Request, res: Response) => {
    if (req.session.user) {
        return res.redirect(req.session.user.is_admin ? '/admin/dashboard' : '/user/dashboard');
    }
    res.redirect('/auth/login');
});

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/api', apiRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).render('errors/404', { title: '404 - Not Found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).render('errors/500', {
        title: '500 - Server Error',
        error: config.env === 'development' ? err : {},
    });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║   VPS Control Panel                           ║
║   Server running on port ${PORT}               ║
║   Environment: ${config.env.padEnd(29)}║
║   URL: ${config.appUrl.padEnd(35)}║
╚═══════════════════════════════════════════════╝
  `);
});

export default app;
