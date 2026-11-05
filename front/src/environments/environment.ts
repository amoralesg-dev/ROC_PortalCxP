export const environment = {
  production: false,
  environmentName: 'local',
  baseUrl: 'http://localhost:8082/ms-pagos',
  oidcIssuer: 'http://localhost:8083/employee-portal',
  employeePortalUrl: 'http://localhost:4205/employee-portal',
  // Contingencia temporal (soporte/validación). OIDC sigue siendo la entrada principal.
  legacyLoginEnabled: true,
  allowedApiOrigins: [
    'http://localhost:8082',
    'http://localhost:8083'
  ]
};