import React from 'react';

import './App.css';

import appSettings from 'appSettings';
import Keycloak, { KeycloakError, KeycloakInitOptions } from 'keycloak-js';
import styled from 'styled-components';

import { ButtonGroup, Divider as MuiDivider } from '@material-ui/core';
import { KeycloakEvent, KeycloakProvider, KeycloakTokens, useKeycloak } from '@react-keycloak/web';
import { DataTierAPI } from '@squonk/data-tier-client';
import {
  AccordionView,
  CardView,
  KeycloakCache,
  Loader,
  LoginButton,
  NglView,
  Scatterplot,
  StateManager,
  useCachedKeycloak,
  useIsStateLoaded,
} from '@squonk/react-sci-components';

import PoseViewerConfig from './PoseViewerConfig';

// Configuration
DataTierAPI.setURI(appSettings.DATA_MANAGER_API_SERVER);

// Auth
const keycloak = Keycloak(process.env.PUBLIC_URL + '/keycloak.json');

const serialisedCache = localStorage.getItem('keycloak-cache');
const tokens =
  serialisedCache !== null ? (JSON.parse(serialisedCache) as KeycloakCache).tokens : {};

const keycloakProviderInitConfig: KeycloakInitOptions = {
  onLoad: 'check-sso',
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  ...tokens,
};

const App = () => {
  // State to trigger rerender when tokens change
  const isLoadingFromJSON = useIsStateLoaded();
  const [keycloakCache, setKeycloakCache] = useCachedKeycloak();
  keycloakCache.tokens?.token && DataTierAPI.setToken(keycloakCache.tokens.token);

  const onKeycloakEvent = (event: KeycloakEvent, error: KeycloakError | undefined) => {
    process.env.NODE_ENV === 'development' && console.log(event, error);
  };

  const onKeycloakTokens = (tokens: KeycloakTokens) => {
    process.env.NODE_ENV === 'development' && console.log('onKeycloakTokens', tokens);
    DataTierAPI.setToken(tokens.token);
    setKeycloakCache({ tokens, authenticated: true });
  };

  return (
    <KeycloakProvider
      keycloak={keycloak}
      initConfig={keycloakProviderInitConfig}
      onEvent={onKeycloakEvent}
      onTokens={onKeycloakTokens}
    >
      <>
        <Loader open={isLoadingFromJSON} reason="Loading..." />
        <AccordionView labels={['Settings / Scatter Plot', 'Card View', 'NGL Viewer']}>
          {(width) => {
            return [
              <FirstPanel width={width} />,
              <CardView width={width} />,
              <NglView width={width} div_id="ngl" height="1000px" />,
            ];
          }}
        </AccordionView>
      </>
    </KeycloakProvider>
  );
};

export default App;

const FirstPanel = ({ width }: { width: number }) => {
  const [keycloak, initialized] = useKeycloak();
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
