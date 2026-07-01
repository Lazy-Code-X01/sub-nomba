import { Router, Request, Response, NextFunction } from 'express';
import { createCustomerSchema, updateCustomerSchema } from './customers.schema';
import * as svc from './customers.service';
import { ok } from '../shared/response';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createCustomerSchema.parse(req.body);
    const customer = await svc.createCustomer(req.tenant.id, input);
    res.status(201).json(ok(customer, 'Customer created'));
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await svc.listCustomers(req.tenant.id);
    res.json(ok(customers));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await svc.getCustomer(req.tenant.id, req.params.id);
    res.json(ok(customer));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateCustomerSchema.parse(req.body);
    const customer = await svc.updateCustomer(req.tenant.id, req.params.id, input);
    res.json(ok(customer, 'Customer updated'));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.deleteCustomer(req.tenant.id, req.params.id);
    res.json(ok(null, 'Customer deleted'));
  } catch (err) {
    next(err);
  }
});

export default router;
