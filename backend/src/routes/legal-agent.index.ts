import { Hono } from 'hono';
import { legalAgentController } from '../controllers/legal-agent.controller';
import { legalAgentRoutes, legalQuery } from './legal-agent.route';
import { authMiddleware } from '../middlewares/auth.middleware';

const legalAgent = new Hono();

// Apply auth middleware to all routes
legalAgent.use('/*', authMiddleware);

// Register routes
legalAgent.post(legalQuery.path, legalAgentController.legalQueryHandler);

export default legalAgent;