const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API Documentation',
      version: '1.0.0',
      description: 'A sample API documentation',
    },
    servers: [{ url: 'mongodb+srv://fatmamelessawy:BBJVLziHn6B6p1MI@cluster0.kk9acoz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0' }],
  },
  apis: [path.join(__dirname, './routes/*.js')], // Path to your route files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = function (app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
