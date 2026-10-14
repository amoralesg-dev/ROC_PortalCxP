export const environment = {
  production: false,
  environmentName: 'dev',
  baseUrl: 'http://10.15.1.15:8082/ms-pagos',
  oidcIssuer: 'https://rss-iam-dev.rassini.com/employee-portal',
  employeePortalUrl: 'https://rss-iam-dev.rassini.com/employee-portal',
  // Contingencia temporal durante estabilización de DEV. Retirar antes de liberar a QA/PROD.
  legacyLoginEnabled: true,
  allowedApiOrigins: [
    'http://10.15.1.15:8082',
    'https://rss-iam-dev.rassini.com'
  ]
};