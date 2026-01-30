import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import config from '../config';

export const showLogin = (req: Request, res: Response) => {
    // Redirect if already logged in
    if (req.session.user) {
        return res.redirect(req.session.user.is_admin ? '/admin/dashboard' : '/user/dashboard');
    }

    res.render('auth/login', {
        title: 'Login',
        error: null,
    });
};

export const handleLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Email and password are required',
            });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password',
            });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password',
            });
        }

        // Create session
        req.session.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            is_admin: user.is_admin,
        };

        // Redirect based on role
        const redirectUrl = user.is_admin ? '/admin/dashboard' : '/user/dashboard';
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Login error:', error);
        res.render('auth/login', {
            title: 'Login',
            error: 'An error occurred during login',
        });
    }
};

export const showRegister = (req: Request, res: Response) => {
    // Redirect if already logged in
    if (req.session.user) {
        return res.redirect(req.session.user.is_admin ? '/admin/dashboard' : '/user/dashboard');
    }

    res.render('auth/register', {
        title: 'Register',
        error: null,
    });
};

export const handleRegister = async (req: Request, res: Response) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // Validate input
        if (!name || !email || !password || !confirmPassword) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'All fields are required',
            });
        }

        if (password !== confirmPassword) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Passwords do not match',
            });
        }

        if (password.length < 8) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Password must be at least 8 characters long',
            });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Email already registered',
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, config.bcrypt.rounds);

        // Create user (always as regular user, not admin)
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                is_admin: false, // Regular users only
            },
        });

        // Create session
        req.session.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            is_admin: user.is_admin,
        };

        // Redirect to user dashboard
        res.redirect('/user/dashboard');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('auth/register', {
            title: 'Register',
            error: 'An error occurred during registration',
        });
    }
};

export const handleLogout = (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/auth/login');
    });
};
