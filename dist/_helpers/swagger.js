"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerPath = void 0;
exports.setupSwagger = setupSwagger;
const path_1 = require("path");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
function setupSwagger(app, yamlPath) {
    const spec = yamljs_1.default.load(yamlPath);
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(spec, { customSiteTitle: 'Boilerplate API' }));
}
const swaggerPath = () => (0, path_1.join)(process.cwd(), 'swagger.yaml');
exports.swaggerPath = swaggerPath;
