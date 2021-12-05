/* eslint-disable react-hooks/rules-of-hooks */
import { useRedux } from 'hooks-for-redux';

import { resolveState } from '../../modules/state/stateResolver';

const initialState: string[] = []; // ids of selected molecules

export const [usePlotSelection, { selectPoints }, plotSelectionStore] = useRedux(
  'plotSelection',
  resolveState('plotSelection', initialState),
  {
    selectPoints: (_, newSelection: string[]) => newSelection,
  },
);
