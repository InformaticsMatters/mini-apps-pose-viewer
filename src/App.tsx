import React from 'react';

import './App.css';

import Keycloak, { KeycloakError, KeycloakInitOptions } from 'keycloak-js';
import isEqual from 'lodash/isEqual';
import styled from 'styled-components';

import { ButtonGroup, Divider as MuiDivider } from '@material-ui/core';
import { KeycloakEvent, KeycloakProvider, KeycloakTokens, useKeycloak } from '@react-keycloak/web';
import { DataTierAPI } from '@squonk/data-tier-services';
import {
  AccordionView,
  CardActionsState,
  cardActionsStore,
  CardView,
  dTypes,
  KeycloakCache,
  Loader,
  LoginButton,
  mergeNewMoleculesState,
  Molecule,
  moleculesStore,
  NglView,
  plotSelectionStore,
  resetCardActions,
  resetIdsInNGLViewer,
  resetWithNewFields,
  Scatterplot,
  selectPoints,
  setDepictionField,
  setFields,
  setIsMoleculesLoading,
  setIsProteinLoading,
  setMoleculesErrorMessage,
  setMoleculesToView,
  setProtein,
  setProteinErrorMessage,
  setTotalParsed,
  Source,
  stateConfig,
  StateManager,
  useCachedKeycloak,
  useIsStateLoaded,
  WorkingSourceState,
  workingSourceStore,
} from '@squonk/react-sci-components';

import PoseViewerConfig from './PoseViewerConfig';

// Subscriptions

// let prevMoleculesSource: Source | null = null;

// const loadMolecules = async (workingSources: WorkingSourceState) => {
//   const state = workingSources.find((slice) => slice.title === 'sdf')?.state ?? null;
//   if (state === null || isEqual(prevMoleculesSource, state)) return;

//   prevMoleculesSource = state;

//   const { projectId, datasetId, maxRecords, configs } = state;

//   try {
//     setMoleculesErrorMessage(null);
//     setIsMoleculesLoading(true);
//     const dataset = await DataTierAPI.downloadDatasetFromProjectAsJSON(projectId, datasetId);

//     const molecules: Molecule[] = [];
//     let totalParsed = 0;
//     for (const mol of dataset) {
//       if (maxRecords !== undefined && molecules.length >= maxRecords) break;
//       const values = Object.entries(mol.values);
//       let valid = true;
//       for (let config of configs ?? []) {
//         const [, value] = values.find(([name]) => config.name === name)!;
//         if (config.dtype !== dTypes.TEXT) {
//           const numericValue = parseFloat(value);
//           if (isNaN(numericValue)) {
//             valid = false;
//             break;
//           }

//           if (config?.min !== undefined && numericValue < config.min) {
//             valid = false;
//             break;
//           }
//           if (config?.max !== undefined && numericValue > config.max) {
//             valid = false;
//             break;
//           }
//           if (!valid) break;
//         }
//       }

//       if (valid)
//         molecules.push({
//           id: totalParsed,
//           fields: values.map(([name, value]) => {
//             const numericValue = parseFloat(value);
//             if (isNaN(numericValue)) {
//               return { name, nickname: name, value };
//             } else {
//               return { name, nickname: name, value: numericValue };
//             }
//           }),
//           molFile: mol.molecule.molblock ?? '', // TODO: handle missing molblock with display of error msg
//         });
//       totalParsed++;
//     }

//     mergeNewMoleculesState({
//       molecules,
//       totalParsed,
//       fields: (configs ?? []).map(({ name, nickname, dtype }) => ({
//         name,
//         nickname: nickname || name,
//         dtype,
//         enabled: true,
//       })),
//     });
//   } catch (error) {
//     console.info({ error });
//     const err = error as Error;
//     if (err.message) {
//       setMoleculesErrorMessage(err.message || 'An unknown error occurred');
//     }
//     setTotalParsed(0);
//   } finally {
//     setIsMoleculesLoading(false);
//   }
// };

// workingSourceStore.subscribe(loadMolecules);

// stateConfig.initializeModule('molecules');

// stateConfig.subscribeToAllInit(async () => {
//   await loadMolecules(workingSourceStore.getState());
// });

// moleculesStore.subscribe(() => {
//   if (!stateConfig.isStateLoadingFromFile()) {
//     resetCardActions();
//   }
// });
// plotSelectionStore.subscribe(() => {
//   if (!stateConfig.isStateLoadingFromFile()) {
//     resetIdsInNGLViewer();
//   }
// });

// stateConfig.initializeModule('cardActions');

// const NUM_ENABLED_DEFAULT = 5;

// moleculesStore.subscribe(({ fields }) => {
//   if (!stateConfig.isStateLoadingFromFile()) {
//     const enabledFields = fields.filter((f) => f.enabled);
//     setFields(
//       enabledFields.map(({ name, nickname, dtype }, index) => ({
//         name,
//         dtype,
//         title: nickname,
//         isVisible: index < NUM_ENABLED_DEFAULT,
//       })),
//     );

//     // Use the first text field as the depiction field - best guess
//     const enabledTextFields = enabledFields.filter((f) => f.dtype === dTypes.TEXT);
//     if (enabledTextFields.length) {
//       setDepictionField(enabledTextFields[0].name);
//     }
//   }
// });

// stateConfig.initializeModule('cardViewConfiguration');

// cardActionsStore.subscribe((state: CardActionsState) => {
//   if (!stateConfig.isStateLoadingFromFile()) {
//     setMoleculesToView(state.isInNGLViewerIds);
//   }
// });

// stateConfig.initializeModule('nglLocalState');

// moleculesStore.subscribe(({ fields }) => {
//   if (!stateConfig.isStateLoadingFromFile()) {
//     resetWithNewFields(fields);
//   }
// });

// stateConfig.initializeModule('plotConfiguration');

// moleculesStore.subscribe(() => {
//   if (!stateConfig.isStateLoadingFromFile()) {
//     selectPoints([]);
//   }
// });

// stateConfig.initializeModule('plotSelection');

// let prevProteinSource: Source | null = null;

// const loadProtein = async (workingSources: WorkingSourceState) => {
//   const state = workingSources.find((slice) => slice.title === 'pdb')?.state ?? null;
//   if (state === null || isEqual(prevProteinSource, state)) return;

//   prevProteinSource = state;

//   const { projectId, datasetId } = state;

//   try {
//     setIsProteinLoading(true);
//     setProteinErrorMessage(null);
//     const dataset = await DataTierAPI.downloadDatasetFromProjectAsNative(projectId, datasetId);
//     setProtein({ definition: dataset });
//   } catch (error) {
//     const err = error as Error;
//     if (err.message) {
//       setProteinErrorMessage(err.message);
//     }
//   } finally {
//     setIsProteinLoading(false);
//   }
// };

// workingSourceStore.subscribe(loadProtein);

// stateConfig.initializeModule('protein');

// stateConfig.subscribeToAllInit(async () => {
//   await loadProtein(workingSourceStore.getState());
// });

// Auth
const keycloak = Keycloak('./keycloak.json');

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
    console.log(event, error);
  };

  const onKeycloakTokens = (tokens: KeycloakTokens) => {
    console.log('onKeycloakTokens', tokens);
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
              // <NglView width={width} div_id="ngl" height="1000px" />,
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
        {/* <PoseViewerConfig /> */}
      </ButtonGroup>
      {/* <StateManager />
      <Divider />
      <Scatterplot width={width} /> */}
    </Column>
  );
};

const Column = styled.div`
  padding: 16px;
`;
/* ${({ theme }) => `padding: ${theme.spacing(2)}px`} */

const Divider = styled(MuiDivider)`
  margin-top: 16px;
  margin-bottom: 16px;
`;
/* margin-top: ${({ theme }) => theme.spacing(2)}px;
  margin-bottom: ${({ theme }) => theme.spacing(2)}px; */
