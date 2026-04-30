import { NextFunction, Request, Response } from 'express';

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (typeof err === 'string') {
    if (err === 'Unauthorized' || err.startsWith('Unauthorized')) {
      return res.status(401).json({ message: err });
    }
    const is404 = err.toLowerCase().endsWith('not found');
    return res.status(is404 ? 404 : 400).json({ message: err });
  }
  if (err && typeof err === 'object' && 'name' in err) {
    const o = err as { name: string; message: string; stack?: string; errors?: unknown[] };
    if (o.name === 'UnauthorizedError' || o.name === 'Unauthorized' || o.message === 'No authorization token was found' || o.message === 'Invalid token') {
      return res.status(401).json({ message: o.message || 'Unauthorized' });
    }
  }
  if (err && typeof err === 'object' && 'name' in err) {
    const o = err as { name: string; message: string; errors?: unknown[] };
    if (o.name === 'ValidationError') {
      return res.status(400).json({ message: o.message, errors: o.errors });
    }
  }
  if (err instanceof Error) {
    return res.status(500).json({ message: err.message || 'Internal error' });
  }
  return res.status(500).json({ message: 'Internal error' });
};
