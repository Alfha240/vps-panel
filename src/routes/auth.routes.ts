import { Router } from 'express';
import {
    showLogin,
    handleLogin,
    showRegister,
    handleRegister,
    handleLogout,
} from '../controllers/auth.controller';

const router = Router();

// Login routes
router.get('/login', showLogin);
router.post('/login', handleLogin);

// Register routes
router.get('/register', showRegister);
router.post('/register', handleRegister);

// Logout route
router.post('/logout', handleLogout);
router.get('/logout', handleLogout); // Allow GET for convenience

export default router;
