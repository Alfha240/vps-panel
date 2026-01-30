import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
    env: string;
    port: number;
    appUrl: string;
    database: {
        url: string;
    };
    session: {
        secret: string;
    };
    jwt: {
        secret: string;
    };
    redis: {
        host: string;
        port: number;
        password?: string;
    };
    bcrypt: {
        rounds: number;
    };
    proxmox: {
        defaultPort: number;
        verifySSL: boolean;
    };
}

const config: Config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    database: {
        url: process.env.DATABASE_URL || '',
    },
    session: {
        secret: process.env.SESSION_SECRET || 'change-this-secret',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'change-this-jwt-secret',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
    },
    bcrypt: {
        rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    },
    proxmox: {
        defaultPort: parseInt(process.env.PROXMOX_DEFAULT_PORT || '8006', 10),
        verifySSL: process.env.PROXMOX_VERIFY_SSL === 'true',
    },
};

export default config;
