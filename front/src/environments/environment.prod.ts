export const environment = {
  production: true,
  environmentName: 'prod',
  baseUrl: 'http://10.15.1.25:8082/ms-pagos', // Cambiar a la URL de producción
  oidcIssuer: 'https://rss-iam.rassini.com/employee-portal',
  allowedApiOrigins: [
    'http://10.15.1.25:8082',
    'https://rss-iam.rassini.com'
  ]
};
