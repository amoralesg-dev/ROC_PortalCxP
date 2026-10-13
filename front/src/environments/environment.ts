export const environment = {
  production: false,
  environmentName: 'local',
  baseUrl: 'http://localhost:8082/ms-pagos',
  oidcIssuer: 'http://localhost:8083/employee-portal',
  allowedApiOrigins: [
    'http://localhost:8082',
    'http://localhost:8083'
  ]
};