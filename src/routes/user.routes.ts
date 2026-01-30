import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';

import { showDashboard } from '../controllers/user/dashboard.controller';
import {
    listServers,
    viewServer,
    controlPower,
} from '../controllers/user/servers.controller';
import { showProfile, updateProfile } from '../controllers/user/profile.controller';

const router = Router();

// Require authentication for all user routes
router.use(requireAuth);

// Dashboard
router.get('/dashboard', showDashboard);

// Servers
router.get('/servers', listServers);
router.get('/servers/:id', viewServer);
router.post('/servers/:id/power', controlPower);

// Profile
router.get('/profile', showProfile);
router.post('/profile', updateProfile);

export default router;
