export const environment = {
  production: true,
  environmentName: 'prod',
  baseUrl: 'http://10.15.1.25:8082/ms-pagos',
  oidcIssuer: 'https://rss-cxp.rassini.com/employee-portal',
  employeePortalUrl: 'https://rss-cxp.rassini.com/employee-portal',
  legacyLoginEnabled: false,
  allowedApiOrigins: [
    'http://10.15.1.25:8082',
    'http://10.15.1.25:8083',
    'https://rss-cxp.rassini.com'
  ]
};
