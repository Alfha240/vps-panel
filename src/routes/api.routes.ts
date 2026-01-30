import { Router } from 'express';
import { requireApiToken, checkPermissions } from '../middlewares/auth';
import rateLimit from 'express-rate-limit';

import {
    apiDeployServer,
    apiListServers,
    apiControlPower,
    apiDeleteServer,
} from '../controllers/api/servers.controller';

const router = Router();

// Rate limiting for API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each token to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to all API routes
router.use(apiLimiter);

// All API routes require valid API token
router.use(requireApiToken);

// Server deployment
router.post('/servers/deploy', checkPermissions(['create_vm']), apiDeployServer);

// List servers
router.get('/servers', checkPermissions(['list_vm']), apiListServers);

// Control server power
router.post('/servers/:id/power', checkPermissions(['control_vm']), apiControlPower);

// Delete server
router.delete('/servers/:id', checkPermissions(['delete_vm']), apiDeleteServer);

export default router;
