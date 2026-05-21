"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    if (typeof err === "string") {
        const is404 = err.toLocaleLowerCase().endsWith("not found");
        const statusCode = is404 ? 404 : 400;
        return res.status(statusCode).json({ message: err });
    }
    if (err instanceof Error) {
        return res.status(500).json({ message: err.message });
    }
    return res.status(500).json({ message: "Internal Sever Error" });
}
