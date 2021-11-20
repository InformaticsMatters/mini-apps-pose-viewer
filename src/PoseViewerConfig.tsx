import React from 'react';

import { getProjectFile } from '@squonk/data-manager-client/project';

import type { ButtonProps } from '@material-ui/core';
import { Typography } from '@material-ui/core';
import type { CardActionsState, CField } from 'components/cardView';
import {
  cardActionsStore,
  CardViewConfig,
  deselectAllWithoutColour,
  disableCards,
  resetCardActions,
  retainColours,
  setDepictionField,
  setFields,
} from 'components/cardView';
import { MultiPage } from 'components/configuration';
import type { Source, WorkingSourceState } from 'components/dataLoader';
import { DataLoader, dTypes, workingSourceStore } from 'components/dataLoader';
import { setMoleculesToView } from 'components/nglViewer';
import {
  plotSelectionStore,
  resetWithNewFields,
  ScatterplotConfig,
  selectPoints,
} from 'components/scatterplot';
import isEqual from 'lodash/isEqual';
import type { Molecule } from 'modules/molecules/molecules';
import {
  mergeNewMoleculesState,
  moleculesStore,
  setIsMoleculesLoading,
  setMoleculesErrorMessage,
  setTotalParsed,
  useMolecules,
} from 'modules/molecules/molecules';
import {
  setIsProteinLoading,
  setProtein,
  setProteinErrorMessage,
  useProtein,
} from 'modules/protein/protein';
import stateConfig from 'modules/state/stateConfig';

/**
 * Subscriptions
 */

let prevMoleculesSource: Source | null = null;

interface DatasetItem {
  uuid: string;
  values: Record<string, unknown>;
  molecule: {
    molBlock: string;
  };
}

const loadMolecules = async (workingSources: WorkingSourceState) => {
  const state = workingSources.find((slice) => slice.title === 'sdf')?.state ?? null;
  if (state === null || isEqual(prevMoleculesSource, state)) return;

  prevMoleculesSource = state;

  const { projectId, filePath, maxRecords, configs } = state;

  const parts = filePath.split('/');
  const fileName = parts.pop() ?? '';
  const path = parts.join('/') || '/';

  try {
    setMoleculesErrorMessage(null);
    setIsMoleculesLoading(true);

    const makeRequest = async () => {
      if (projectId && fileName) {
        return await getProjectFile(projectId, {
          file: fileName,
          path,
        });
      }
      return undefined;
    };

    const file = await makeRequest();

    const datasetItems: DatasetItem[] = JSON.parse((await file?.text()) ?? '[]');
    let totalParsed = 0;
    const molecules: Molecule[] = [];

    for (const mol of datasetItems) {
      if (maxRecords !== undefined && molecules.length >= maxRecords) break;
      const values = Object.entries(mol.values);

      let valid = true;
      for (const config of configs ?? []) {
        const pair = values.find(([name]) => config.name === name);
        // The dataset isn't guaranteed to have the value for this config
        const value = pair?.[1] as string;

        // If the value type is numeric check against the filters
        if (config.dtype !== dTypes.TEXT) {
          const numericValue = parseFloat(value ?? '');

          // Nan occurs for non-numeric strings, empty strings & undefined
          const hasNumericFilter = config.min !== undefined || config.max !== undefined;
          if (isNaN(numericValue) && hasNumericFilter) {
            valid = false;
            break;
          }

          // Each filter must be applied separately
          if (config.min !== undefined && numericValue < config.min) {
            valid = false;
            break;
          }
          if (config.max !== undefined && numericValue > config.max) {
            valid = false;
            break;
          }
        }
      }

      if (valid)
        molecules.push({
          id: mol.uuid,
          fields:
            configs?.map(({ name }) => {
              const value = values.find(([n]) => n === name);
              if (value === undefined) {
                return { name, nickname: name, value: null };
              }
              const v = value[1] as string;
              const numericValue = parseFloat(v);
              if (isNaN(numericValue)) {
                return { name, nickname: name, value: v };
              }
              return { name, nickname: name, value: numericValue };
            }) ?? [],
          molFile: mol.molecule.molBlock,
        });

      totalParsed++;
    }

    mergeNewMoleculesState({
      filePath,
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

/**
 * Card Actions Subscriptions
 */

let prevFilePath: string | null = null;

// Reset selected cards / pinned (coloured) cards when molecules are loaded
moleculesStore.subscribe(({ filePath, molecules }) => {
  if (!stateConfig.isStateLoadingFromFile()) {
    if (prevFilePath === filePath) {
      const newIds = molecules.map((m) => m.id);

      retainColours(newIds);
      disableCards();
    } else {
      resetCardActions();
    }

    // Keep the dataset id available to check for changes
    prevFilePath = filePath;
  }
});

// Only reset the selected molecules in the card view when a new selection is made
plotSelectionStore.subscribe(() => {
  if (!stateConfig.isStateLoadingFromFile()) {
    deselectAllWithoutColour();
  }
});

stateConfig.initializeModule('cardActions');

const NUM_ENABLED_DEFAULT = 5;

let prevFields: CField[] | null = null;

moleculesStore.subscribe(({ fields }) => {
  if (!stateConfig.isStateLoadingFromFile()) {
    const enabledFields = fields.filter((f) => f.enabled);
    const newFields = enabledFields.map(({ name, nickname, dtype }, index) => ({
      name,
      dtype,
      title: nickname,
      // Use previous visibility if it exists otherwise use a default number
      isVisible:
        index < NUM_ENABLED_DEFAULT || !!prevFields?.find((f) => f.name === name)?.isVisible,
    }));
    setFields(newFields);

    // Use the first text field as the depiction field - best guess
    const enabledTextFields = enabledFields.filter((f) => f.dtype === dTypes.TEXT);
    if (enabledTextFields.length) {
      setDepictionField(enabledTextFields[0].name);
    }

    // Keep the fields available to allow for visibility preservation between loads
    prevFields = newFields;
  }
});

stateConfig.initializeModule('cardViewConfiguration');

cardActionsStore.subscribe((state: CardActionsState) => {
  if (!stateConfig.isStateLoadingFromFile()) {
    setMoleculesToView(state.selectedIds);
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

  const { projectId, filePath } = state;

  const parts = filePath.split('/');
  const fileName = parts.pop() ?? '';
  const path = parts.join('/') || '/';

  try {
    setIsProteinLoading(true);
    setProteinErrorMessage(null);

    const makeRequest = async () => {
      if (projectId && fileName) {
        return (await getProjectFile(projectId, {
          file: fileName,
          path,
        })) as unknown as string;
      }
      return '';
    };

    const file = await makeRequest();

    setProtein({ definition: file });
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

/**
 * Configuration modal for the Pose Viewer Mini App
 * This is a hard-coded example of a mini-app
 */
const PoseViewerConfig = ({ ...buttonProps }: ButtonProps) => {
  // Card View / Scatterplot / DataLoader
  const { molecules, fields, totalParsed, isMoleculesLoading, moleculesErrorMessage } =
    useMolecules();
  const { isProteinLoading, proteinErrorMessage } = useProtein();

  return (
    <MultiPage
      buttonProps={buttonProps}
      height={'80vh'}
      titles={['PDB Source', 'SDF Sources', 'Scatterplot', 'Card View']}
      width={'52rem'}
    >
      {/* PDB */}
      <DataLoader
        enableConfigs={false}
        error={proteinErrorMessage}
        loading={isProteinLoading}
        mimeType="chemical/x-pdb"
        title="pdb"
      />
      {/* SDF */}
      <DataLoader
        enableConfigs
        error={moleculesErrorMessage}
        loading={isMoleculesLoading}
        moleculesKept={molecules.length}
        title="sdf"
        totalParsed={totalParsed}
      />
      {/* Scatterplot */}
      <ScatterplotConfig fields={fields} title="Scatterplot" />
      {/* Card View */}
      {molecules.length ? (
        <CardViewConfig title="Card View" />
      ) : (
        <Typography>No molecules are loaded yet</Typography>
      )}
    </MultiPage>
  );
};

export default PoseViewerConfig;
