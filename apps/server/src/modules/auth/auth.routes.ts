import { Router, Request, Response, NextFunction } from 'express';
import { signupSchema, loginSchema } from './auth.schema';
import * as svc from './auth.service';
import { ok } from '../shared/response';

const router = Router();

router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = signupSchema.parse(req.body);
    const result = await svc.signup(input);
    res.status(201).json(ok(result, 'Account created'));
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await svc.login(input);
    res.json(ok(result));
  } catch (err) {
    next(err);
  }
});

export default router;
