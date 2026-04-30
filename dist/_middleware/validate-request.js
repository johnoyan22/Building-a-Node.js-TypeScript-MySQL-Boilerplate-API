"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
function validateRequest(req, next, schema) {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true, convert: true });
    if (error) {
        const details = error.details.map((d) => d.message).join('; ');
        next(`Validation: ${details}`);
        return;
    }
    req.body = value;
    next();
}
