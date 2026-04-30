import { Express } from 'express';
import { join } from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

export function setupSwagger(app: Express, yamlPath: string) {
  const spec = YAML.load(yamlPath);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: 'Boilerplate API' }));
}

export const swaggerPath = () => join(process.cwd(), 'swagger.yaml');
