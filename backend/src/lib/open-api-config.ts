import { Scalar } from '@scalar/hono-api-reference';
import packageJson from '../../package.json';
import { AppOpenApi } from '../types';

export default function openApiConfig(app: AppOpenApi) {
  app.doc('/doc', {
    openapi: '3.1.1',
    info: {
      title: 'Doc-Talk API',
      version: packageJson.version
    }
  });

  app.get(
    '/reference',
    Scalar({
      url: '/doc',
      theme: 'bluePlanet'
    })
  );
}
