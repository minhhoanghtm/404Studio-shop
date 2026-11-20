import express, { Request, Response } from 'express';

export const healthRouter = express.Router();

const healthResponse = () => ({
  status: 'UP',
  service: 'atelier-ai-service',
  framework: 'TypeScript Spring-AI Architecture',
  runtime: `Node.js ${process.version}`,
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
});

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json(healthResponse());
});

healthRouter.get('/health/liveness', (_req: Request, res: Response) => {
  res.status(200).json(healthResponse());
});

healthRouter.get('/health/readiness', (_req: Request, res: Response) => {
  res.status(200).json(healthResponse());
});

// Spring Actuator compatibility
healthRouter.get('/actuator/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    components: {
      diskSpace: { status: 'UP' },
      ping: { status: 'UP' },
      vectorStore: { status: 'UP' },
    },
  });
});

healthRouter.get('/actuator/health/readiness', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});
