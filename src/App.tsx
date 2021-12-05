import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { setAuthToken, setBaseUrl } from '@squonk/data-manager-client';

import { ButtonGroup, Divider as MuiDivider, useTheme } from '@material-ui/core';
import { ReactKeycloakProvider, useKeycloak } from '@react-keycloak/web';
import appSettings from 'appSettings';
import AccordionView from 'components/AccordionView';
import { CardView } from 'components/cardView';
import Loader from 'components/Loader';
import LoginButton from 'components/LoginButton';
import { NglView } from 'components/nglViewer';
import { Scatterplot } from 'components/scatterplot';
import { StateManager } from 'components/state';
import { useIsStateLoaded } from 'hooks';
import type { KeycloakError } from 'keycloak-js';
import Keycloak from 'keycloak-js';
import styled, { ThemeProvider } from 'styled-components';

import PoseViewerConfig from './PoseViewerConfig';

import './App.css';

// DM Client Config
const queryClient = new QueryClient();

setBaseUrl(appSettings.DATA_MANAGER_API_SERVER);

// Auth
const keycloak = Keycloak(process.env.PUBLIC_URL + '/keycloak.json');

const App = () => {
  // State to trigger rerender when tokens change
  const isLoadingFromJSON = useIsStateLoaded();

  const onKeycloakEvent = (event: any, error: KeycloakError | undefined) => {
    // process.env.NODE_ENV === 'development' && console.log(event, error);
  };

  const onKeycloakTokens = (tokens: any) => {
    // process.env.NODE_ENV === 'development' && console.log('onKeycloakTokens', tokens);
    setAuthToken(tokens.token);
  };

  const theme = useTheme();

  return (
    <ReactKeycloakProvider
      // initConfig={keycloakProviderInitConfig}
      authClient={keycloak}
      onEvent={onKeycloakEvent}
      onTokens={onKeycloakTokens}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <Loader open={isLoadingFromJSON} reason="Loading..." />
          <AccordionView labels={['Settings / Scatter Plot', 'Card View', 'NGL Viewer']}>
            {(width) => {
              return [
                <FirstPanel key={0} width={width} />,
                <CardView key={1} width={width} />,
                <NglView div_id="ngl" height="1000px" key={2} width={width} />,
              ];
            }}
          </AccordionView>
        </ThemeProvider>
      </QueryClientProvider>
      `
    </ReactKeycloakProvider>
  );
};

export default App;

const FirstPanel = ({ width }: { width: number }) => {
  const { keycloak, initialized } = useKeycloak();
  if (initialized && !keycloak.authenticated) {
    keycloak.login();
  }
  return (
    <Column>
      <ButtonGroup>
        <LoginButton />
        <PoseViewerConfig />
      </ButtonGroup>
      <StateManager />
      <Divider />
      <Scatterplot width={width} />
    </Column>
  );
};

const Column = styled.div`
  ${({ theme }) => `padding: ${theme.spacing(2)}px`}
`;

const Divider = styled(MuiDivider)`
  margin-top: ${({ theme }) => theme.spacing(2)}px;
  margin-bottom: ${({ theme }) => theme.spacing(2)}px;
`;
