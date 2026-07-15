import { Router, Request, Response, IRouter } from 'express';

const router: IRouter = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default router;
