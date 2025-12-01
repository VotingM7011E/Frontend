import React from 'react';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  handleLogin: () => void;  // Keycloak handles login redirect
  handleLogout: () => void;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  handleLogin: () => {},
  handleLogout: () => {},
});

export default AuthContext;
