// Keycloak configuration
// Update these values to match your Keycloak setup

export const keycloakConfig = {
  url: 'https://keycloak-dev.ltu-m7011e-2.se',  // Keycloak 17+ doesn't need /auth
  realm: 'master',                               // Using master realm
  clientId: 'meeting-frontend'                   // Client ID created in Keycloak
};
