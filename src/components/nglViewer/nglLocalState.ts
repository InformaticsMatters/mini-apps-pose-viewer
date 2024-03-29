/* eslint-disable react-hooks/rules-of-hooks */
import { useRedux } from 'hooks-for-redux';

import { resolveState } from '../../modules/state/stateResolver';
import { BACKGROUND_COLOR, NGL_PARAMS } from './constants';

export interface NGLLocalState {
  nglOrientations: any;
  viewParams: any;
  molsInView: string[];
  firstTimeShowLigand: boolean;
}

export const initialState: NGLLocalState = {
  nglOrientations: {},
  viewParams: {
    [NGL_PARAMS.backgroundColor]: BACKGROUND_COLOR.white,
    [NGL_PARAMS.clipNear]: 42,
    [NGL_PARAMS.clipFar]: 100,
    [NGL_PARAMS.clipDist]: 10,
    [NGL_PARAMS.fogNear]: 50,
    [NGL_PARAMS.fogFar]: 62,
  },
  molsInView: [],
  firstTimeShowLigand: true,
};

export const [
  useNGLLocalState,
  { removeAllNglComponents, setNglOrientation, setMoleculesToView, setFirstTimeShowLigand },
  nglLocalStateStore,
] = useRedux('nglLocalState', resolveState('nglLocalState', initialState), {
  removeAllNglComponents: (state, stage: any) => {
    stage.removeAllComponents();
    return { ...state, initialState };
  },
  setNglOrientation: (state, orientationInfo: any) => {
    const div_id = orientationInfo.div_id;
    const orientation = orientationInfo.orientation;
    const toSetDiv = { ...state.nglOrientations };
    toSetDiv[div_id] = orientation;
    return { ...state, nglOrientations: toSetDiv };
  },
  setMoleculesToView: (state, molecules: string[]) => {
    return { ...state, molsInView: molecules ? molecules : [] };
  },
  setFirstTimeShowLigand: (state, firstTime: boolean) => {
    return { ...state, firstTimeShowLigand: firstTime };
  },
});
