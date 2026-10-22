export const environment = {
  production: false,
  environmentName: 'dev',
  baseUrl: 'http://10.15.1.15:8082/ms-pagos',
  oidcIssuer: 'https://rss-cxp-dev.rassini.com/employee-portal',
  employeePortalUrl: 'https://rss-cxp-dev.rassini.com/employee-portal',
  // Contingencia temporal durante estabilización de DEV. Retirar antes de liberar a QA/PROD.
  legacyLoginEnabled: false,
  allowedApiOrigins: [
    'http://10.15.1.15:8082',
    'http://10.15.1.15:8083',
    'https://rss-cxp-dev.rassini.com'
  ]
};
