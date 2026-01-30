import { Router } from 'express';
import { requireAdmin } from '../middlewares/auth';

// Import controllers
import { showDashboard } from '../controllers/admin/dashboard.controller';
import {
    listLocations,
    createLocation,
    updateLocation,
    deleteLocation,
} from '../controllers/admin/locations.controller';
import {
    listNodes,
    createNode,
    updateNode,
    deleteNode,
} from '../controllers/admin/nodes.controller';
import {
    listServers,
    suspendServer,
    unsuspendServer,
    deleteServer,
} from '../controllers/admin/servers.controller';
import {
    listIPPools,
    createIPPool,
    deleteIPPool,
    viewIPAddresses,
} from '../controllers/admin/ipam.controller';
import {
    listUsers,
    toggleAdmin,
    deleteUser,
} from '../controllers/admin/users.controller';
import {
    listAPITokens,
    generateAPIToken,
    revokeAPIToken,
    deleteAPIToken,
} from '../controllers/admin/api-tokens.controller';
import {
    listPlans,
    createPlan,
    updatePlan,
    deletePlan,
} from '../controllers/admin/plans.controller';

const router = Router();

// Require admin for all routes
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', showDashboard);

// Locations
router.get('/locations', listLocations);
router.post('/locations', createLocation);
router.post('/locations/:id', updateLocation);
router.post('/locations/:id/delete', deleteLocation);

// Nodes
router.get('/nodes', listNodes);
router.post('/nodes', createNode);
router.post('/nodes/:id', updateNode);
router.post('/nodes/:id/delete', deleteNode);

// Servers
router.get('/servers', listServers);
router.post('/servers/:id/suspend', suspendServer);
router.post('/servers/:id/unsuspend', unsuspendServer);
router.post('/servers/:id/delete', deleteServer);

// IPAM
router.get('/ipam', listIPPools);
router.post('/ipam', createIPPool);
router.post('/ipam/:id/delete', deleteIPPool);
router.get('/ipam/:poolId/addresses', viewIPAddresses);

// Users
router.get('/users', listUsers);
router.post('/users/:id/toggle-admin', toggleAdmin);
router.post('/users/:id/delete', deleteUser);

// API Tokens
router.get('/api-tokens', listAPITokens);
router.post('/api-tokens', generateAPIToken);
router.post('/api-tokens/:id/revoke', revokeAPIToken);
router.post('/api-tokens/:id/delete', deleteAPIToken);

// Plans
router.get('/plans', listPlans);
router.post('/plans', createPlan);
router.post('/plans/:id', updatePlan);
router.post('/plans/:id/delete', deletePlan);

export default router;
