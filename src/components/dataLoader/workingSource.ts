/* eslint-disable react-hooks/rules-of-hooks */
/**
 * Redux slice for data sources and field configurations
 */

import type { SavedFile } from '@squonk/react-sci-components/FileSelector';

import { useRedux } from 'hooks-for-redux';

import { initializeModule } from '../../modules/state/stateConfig';
import { resolveState } from '../../modules/state/stateResolver';

export type SchemaType = 'string' | 'number' | 'integer' | 'array' | 'boolean' | 'null';

export interface FieldConfig {
  name: string;
  nickname?: string;
  rank?: 'asc' | 'desc'; // TODO: make ENUM
  dtype: SchemaType;
  transform?: string;
  defaultValue?: number | string;
  min?: number;
  max?: number;
}

export interface Source {
  projectId: string;
  file: SavedFile;
  maxRecords?: number;
  configs?: FieldConfig[];
}

export type WorkingSourceState = { title: string; state: Source | null }[];

type SetWorkingSourcePayload = { title: string; state: NonNullable<Source> };

export const [useWorkingSource, { setWorkingSource }, workingSourceStore] = useRedux(
  'workingSource',
  resolveState('workingSource', [] as WorkingSourceState),
  {
    setWorkingSource: (prevState, { title, state }: SetWorkingSourcePayload) => {
      const toUpdate = prevState.findIndex((state) => state.title === title);
      if (toUpdate !== -1) {
        return prevState.map((slice, index) => (index === toUpdate ? { title, state } : slice));
      }
      return [...prevState, { title, state }];
    },
  },
);

// initializeModule('sources');
initializeModule('workingSource');
