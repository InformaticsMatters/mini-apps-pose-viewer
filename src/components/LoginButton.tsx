import React from 'react';

import type { ButtonProps } from '@material-ui/core';
import { Button, CircularProgress } from '@material-ui/core';
import { useKeycloak } from '@react-keycloak/web';
import styled from 'styled-components';

const LoginButton: React.FC<ButtonProps> = (buttonProps) => {
  const { keycloak, initialized } = useKeycloak();
  const isAuthenticated = !!keycloak?.authenticated;

  const authLogin = () => {
    keycloak?.login();
  };
  const authLogout = () => {
    keycloak?.logout();
  };

  return (
    <Button
      color="default"
      disabled={!initialized}
      variant="outlined"
      onClick={!isAuthenticated ? authLogin : authLogout}
      {...buttonProps}
    >
      {isAuthenticated ? 'logout' : 'login'}
      {!initialized && <Progress size={24} />}
    </Button>
  );
};

export default LoginButton;

// TODO: Make reusable @ref DataLoader.tsx
const Progress = styled(CircularProgress)`
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -12px;
  margin-left: -12px;
`;
