export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TrouveTout224 API',
      version: '1.0.0',
      description: 'API de la plateforme d\'annonces TrouveTout224 - Guinée',
    },
    servers: [{ url: 'http://localhost:5000/api', description: 'Développement' }],
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};
