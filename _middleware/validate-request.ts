import { NextFunction, Request } from 'express';
import { ObjectSchema } from 'joi';

export function validateRequest(req: Request, next: NextFunction, schema: ObjectSchema): void {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true, convert: true });
  if (error) {
    const details = error.details.map((d) => d.message).join('; ');
    next(`Validation: ${details}`);
    return;
  }
  (req as Request & { body: unknown }).body = value;
  next();
}
