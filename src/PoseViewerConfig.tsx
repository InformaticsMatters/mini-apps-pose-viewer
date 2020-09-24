import React from 'react';

import isEqual from 'lodash/isEqual';

import { ButtonProps, Typography } from '@material-ui/core';
import { DataTierAPI, MIMETypes } from '@squonk/data-tier-client';
import {
  CardActionsState,
  cardActionsStore,
  CardViewConfig,
  DataLoader,
  dTypes,
  mergeNewMoleculesState,
  Molecule,
  moleculesStore,
  MultiPage,
  plotSelectionStore,
  resetCardActions,
  resetIdsInNGLViewer,
  resetWithNewFields,
  ScatterplotConfig,
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
  useMolecules,
  useProtein,
  WorkingSourceState,
  workingSourceStore,
} from '@squonk/react-sci-components';

/**
 * Subscriptions
 */

let prevMoleculesSource: Source | null = null;

const loadMolecules = async (workingSources: WorkingSourceState) => {
  const state = workingSources.find((slice) => slice.title === 'sdf')?.state ?? null;
  if (state === null || isEqual(prevMoleculesSource, state)) return;

  prevMoleculesSource = state;

  const { projectId, datasetId, maxRecords, configs } = state;

  try {
    setMoleculesErrorMessage(null);
    setIsMoleculesLoading(true);
    const dataset = await DataTierAPI.downloadDatasetFromProjectAsJSON(projectId, datasetId);

    const molecules: Molecule[] = [];
    let totalParsed = 0;
    for (const mol of dataset) {
      if (maxRecords !== undefined && molecules.length >= maxRecords) break;
      const values = Object.entries(mol.values);
      let valid = true;
      for (let config of configs ?? []) {
        const pair = values.find(([name]) => config.name === name);
        if (pair !== undefined) {
          const [, value] = pair;
          if (config.dtype !== dTypes.TEXT) {
            const numericValue = parseFloat(value);
            if (isNaN(numericValue)) {
              valid = false;
              break;
            }

            if (config?.min !== undefined && numericValue < config.min) {
              valid = false;
              break;
            }
            if (config?.max !== undefined && numericValue > config.max) {
              valid = false;
              break;
            }
            if (!valid) break;
          }
        }
      }

      if (valid)
        molecules.push({
          id: totalParsed,
          fields:
            configs?.map(({ name }) => {
              const value = values.find(([n]) => n === name);
              if (value === undefined) {
                return { name, nickname: name, value: null };
              } else {
                const [, v] = value;
                const numericValue = parseFloat(v);
                if (isNaN(numericValue)) {
                  return { name, nickname: name, value: v };
                } else {
                  return { name, nickname: name, value: numericValue };
                }
              }
            }) ?? [],
          molFile: mol.molecule.molblock ?? '', // TODO: handle missing molblock with display of error msg
        });
      totalParsed++;
    }

    mergeNewMoleculesState({
      molecules,
      totalParsed,
      fields: (configs ?? []).map(({ name, nickname, dtype }) => ({
        name,
        nickname: nickname || name,
        dtype,
        enabled: true,
      })),
    });
  } catch (error) {
    console.info({ error });
    const err = error as Error;
    console.error(err);
    if (err.message) {
      setMoleculesErrorMessage(err.message || 'An unknown error occurred');
    }
    setTotalParsed(0);
  } finally {
    setIsMoleculesLoading(false);
  }
};

workingSourceStore.subscribe(loadMolecules);

stateConfig.initializeModule('molecules');

stateConfig.subscribeToAllInit(async () => {
  await loadMolecules(workingSourceStore.getState());
});

moleculesStore.subscribe(() => {
  if (!stateConfig.isStateLoadingFromFile()) {
    resetCardActions();
  }
});
plotSelectionStore.subscribe(() => {
  if (!stateConfig.isStateLoadingFromFile()) {
    resetIdsInNGLViewer();
  }
});

stateConfig.initializeModule('cardActions');

const NUM_ENABLED_DEFAULT = 5;

moleculesStore.subscribe(({ fields }) => {
  if (!stateConfig.isStateLoadingFromFile()) {
    const enabledFields = fields.filter((f) => f.enabled);
    setFields(
      enabledFields.map(({ name, nickname, dtype }, index) => ({
        name,
        dtype,
        title: nickname,
        isVisible: index < NUM_ENABLED_DEFAULT,
      })),
    );

    // Use the first text field as the depiction field - best guess
    const enabledTextFields = enabledFields.filter((f) => f.dtype === dTypes.TEXT);
    if (enabledTextFields.length) {
      setDepictionField(enabledTextFields[0].name);
    }
  }
});

stateConfig.initializeModule('cardViewConfiguration');

cardActionsStore.subscribe((state: CardActionsState) => {
  if (!stateConfig.isStateLoadingFromFile()) {
    setMoleculesToView(state.isInNGLViewerIds);
  }
});

stateConfig.initializeModule('nglLocalState');

moleculesStore.subscribe(({ fields }) => {
  if (!stateConfig.isStateLoadingFromFile()) {
    resetWithNewFields(fields);
  }
});

stateConfig.initializeModule('plotConfiguration');

moleculesStore.subscribe(() => {
  if (!stateConfig.isStateLoadingFromFile()) {
    selectPoints([]);
  }
});

stateConfig.initializeModule('plotSelection');

let prevProteinSource: Source | null = null;

const loadProtein = async (workingSources: WorkingSourceState) => {
  const state = workingSources.find((slice) => slice.title === 'pdb')?.state ?? null;
  if (state === null || isEqual(prevProteinSource, state)) return;

  prevProteinSource = state;

  const { projectId, datasetId } = state;

  try {
    setIsProteinLoading(true);
    setProteinErrorMessage(null);
    const dataset = await DataTierAPI.downloadDatasetFromProjectAsNative(projectId, datasetId);
    setProtein({ definition: dataset });
  } catch (error) {
    const err = error as Error;
    if (err.message) {
      setProteinErrorMessage(err.message);
    }
  } finally {
    setIsProteinLoading(false);
  }
};

workingSourceStore.subscribe(loadProtein);

stateConfig.initializeModule('protein');

stateConfig.subscribeToAllInit(async () => {
  await loadProtein(workingSourceStore.getState());
});

interface IProps {}

/**
 * Configuration modal for the Pose Viewer Mini App
 * This is a hard-coded example of a mini-app
 */
const PoseViewerConfig = ({ ...buttonProps }: IProps & ButtonProps) => {
  // Card View / Scatterplot / DataLoader
  const {
    molecules,
    fields,
    totalParsed,
    isMoleculesLoading,
    moleculesErrorMessage,
  } = useMolecules();
  const { isProteinLoading, proteinErrorMessage } = useProtein();

  return (
    <MultiPage
      width={'52rem'}
      height={'80vh'}
      titles={['PDB Source', 'SDF Sources', 'Scatterplot', 'Card View']}
      buttonProps={buttonProps}
    >
      {/* PDB */}
      <DataLoader
        loading={isProteinLoading}
        error={proteinErrorMessage}
        title="pdb"
        fileType={MIMETypes.PDB}
        enableConfigs={false}
      />
      {/* SDF */}
      <DataLoader
        loading={isMoleculesLoading}
        error={moleculesErrorMessage}
        title="sdf"
        fileType={MIMETypes.SDF}
        enableConfigs
        totalParsed={totalParsed}
        moleculesKept={molecules.length}
      />
      {/* Scatterplot */}
      <ScatterplotConfig title="Scatterplot" fields={fields} />
      {/* Card View */}
      {!!molecules.length ? (
        <CardViewConfig title="Card View" />
      ) : (
        <Typography>No molecules are loaded yet</Typography>
      )}
    </MultiPage>
  );
};

export default PoseViewerConfig;
