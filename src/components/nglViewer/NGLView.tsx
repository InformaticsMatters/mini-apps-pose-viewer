import React, { memo, useCallback, useEffect, useState } from 'react';

import type { Theme } from '@material-ui/core/styles';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { throttle } from 'lodash';
import { Stage } from 'ngl';

import type { Molecule } from '../../modules/molecules/molecules';
import { useMolecules } from '../../modules/molecules/molecules';
import { useProtein } from '../../modules/protein/protein';
import { isStateLoadingFromFile } from '../../modules/state/stateConfig';
import type { Colour } from '../cardView/cardActions';
import { useCardActions } from '../cardView/cardActions';
import { NGL_PARAMS, VIEWS } from './constants';
import { removeNglComponents, setOrientation } from './dispatchActions';
import {
  initialState as NGL_INITIAL,
  setFirstTimeShowLigand,
  useNGLLocalState,
} from './nglLocalState';
import { showInteractions, showLigands, showProtein } from './renderingObjects';

export interface NGLMolecule {
  id: string;
  mol: Molecule;
  color: string;
}

interface ViewListItem {
  id: string;
  stage: any;
}

const getMoleculeObjects = (
  molIds: string[],
  colors: Colour[],
  molecules: Molecule[],
): NGLMolecule[] => {
  let i;
  const selectedMols: NGLMolecule[] = [];
  if (molIds && molIds.length > 0 && molecules && molecules.length > 0) {
    for (i = 0; i < molIds.length; i++) {
      const currentId = molIds[i];
      const currentColor = colors.filter((col) => col.id === currentId);
      const currentMol = molecules.filter((mol) => mol.id === currentId);
      if (currentMol) {
        const nglMol: NGLMolecule = {
          id: currentId,
          color: currentColor && currentColor.length === 1 ? currentColor[0].colour : '#909090',
          mol: currentMol[0],
        };
        selectedMols.push(nglMol);
      }
    }
  }

  return selectedMols;
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.spacing(1) / 2,
      boxShadow: 'none',
    },
  }),
);

interface IProps {
  div_id: string;
  height: string;
  width: number;
}

export const NglView: React.FC<IProps> = memo(({ div_id, width }) => {
  // connect to NGL Stage object

  const { nglOrientations, molsInView, firstTimeShowLigand } = useNGLLocalState();
  const { protein } = useProtein();
  const [stage, setStage] = useState<any>(null);
  const [nglViewList, setNglViewList] = useState<ViewListItem[]>([]);
  const { molecules } = useMolecules();

  const { colours } = useCardActions();
  const classes = useStyles();

  const handleNglViewPick = (stage: any, pickingProxy: any, getNglView: any) => {
    if (pickingProxy !== undefined && pickingProxy.component) {
      if (pickingProxy.component.name && pickingProxy.component.name.endsWith('_LIGAND')) {
        pickingProxy.component.autoView('ligand');
      } else {
        stage.animationControls.move(pickingProxy.position.clone());
      }
    }
  };

  const registerNglView = useCallback(
    (id: string, stage: any) => {
      if (nglViewList.filter((ngl) => ngl.id === id).length > 0) {
        console.log(new Error(`Cannot register NGL View with used ID! ${id}`));
      } else {
        const extendedList = nglViewList;
        extendedList.push({ id, stage });
        setNglViewList(extendedList);
      }
    },
    [nglViewList],
  );

  const unregisterNglView = useCallback(
    (id: string) => {
      if (nglViewList.filter((ngl) => ngl.id === id).length === 0) {
        console.log(new Error(`Cannot remove NGL View with given ID! ${id}`));
      } else {
        for (let i = 0; i < nglViewList.length; i++) {
          if (nglViewList[i].id === id) {
            nglViewList.splice(i, 1);
            setNglViewList(nglViewList);
            break;
          }
        }
      }
    },
    [nglViewList],
  );

  const getNglView = useCallback(
    (id: string) => {
      const filteredList =
        nglViewList && nglViewList.length > 0 ? nglViewList.filter((ngl) => ngl.id === id) : [];
      switch (filteredList.length) {
        case 0:
          return undefined;
        case 1:
          return filteredList[0];
        default:
          console.log(new Error('Cannot found NGL View with given ID!'));
          return undefined;
      }
    },
    [nglViewList],
  );

  const handleOrientationChanged = useCallback(
    throttle(() => {
      const newStage = getNglView(div_id);
      if (newStage) {
        const currentOrientation = newStage.stage.viewerControls.getOrientation();
        setOrientation(div_id, currentOrientation, nglOrientations);
      }
    }, 250),
    [div_id, getNglView, setOrientation],
  );

  // Initialization of NGL View component
  const handleResize = useCallback(() => {
    const newStage = getNglView(div_id);
    if (newStage) {
      setTimeout(() => newStage.stage.handleResize(), 100);
    }
  }, [div_id, getNglView]);

  // Resize the stage whenever the container width changes
  useEffect(() => handleResize(), [width, handleResize]);

  const registerStageEvents = useCallback(
    (newStage, getNglView) => {
      if (newStage) {
        window.addEventListener('resize', handleResize);
        newStage.mouseControls.add('clickPick-left', (st: any, pickingProxy: any) =>
          handleNglViewPick(st, pickingProxy, getNglView),
        );

        newStage.mouseObserver.signals.scrolled.add(handleOrientationChanged);
        newStage.mouseObserver.signals.dropped.add(handleOrientationChanged);
        newStage.mouseObserver.signals.dragged.add(handleOrientationChanged);
      }
    },
    [handleResize, handleOrientationChanged /*, handleNglViewPick*/],
  );

  const unregisterStageEvents = useCallback(
    (newStage, getNglView) => {
      if (newStage) {
        window.addEventListener('resize', handleResize);
        window.removeEventListener('resize', handleResize);
        newStage.mouseControls.remove('clickPick-left', (st: any, pickingProxy: any) =>
          handleNglViewPick(st, pickingProxy, getNglView),
        );
        newStage.mouseObserver.signals.scrolled.remove(handleOrientationChanged);
        newStage.mouseObserver.signals.dropped.remove(handleOrientationChanged);
        newStage.mouseObserver.signals.dragged.remove(handleOrientationChanged);
      }
    },
    [handleResize, handleOrientationChanged /*, handleNglViewPick*/],
  );

  useEffect(() => {
    if (nglOrientations && stage !== null && nglOrientations[div_id] !== undefined) {
      stage.viewerControls.orient(nglOrientations[div_id].elements);
    }
  }, [nglOrientations, stage, div_id]);

  useEffect(() => {
    const nglViewFromContext = getNglView(div_id);
    let molsToDisplay;
    if (stage == null && !nglViewFromContext) {
      const newStage = new Stage(div_id);
      // set default settings
      if (div_id === VIEWS.MAJOR_VIEW) {
        // set all defaults for main view
        for (const [key, value] of Object.entries(NGL_INITIAL.viewParams)) {
          newStage.setParameters({ [key]: value });
        }
      } else {
        // set only background color for preview view
        newStage.setParameters({
          [NGL_PARAMS.backgroundColor]: NGL_INITIAL.viewParams[NGL_PARAMS.backgroundColor],
        });
      }
      registerNglView(div_id, newStage);
      registerStageEvents(newStage, getNglView);
      setStage(newStage);
      removeNglComponents(newStage);
      showProtein(newStage, protein.definition, firstTimeShowLigand);
      molsToDisplay = getMoleculeObjects(molsInView, colours, molecules);
      showLigands(newStage, molsToDisplay, firstTimeShowLigand);
      showInteractions(newStage, molsToDisplay);
    } else if (stage == null && nglViewFromContext && nglViewFromContext.stage) {
      registerStageEvents(nglViewFromContext.stage, getNglView);
      setStage(nglViewFromContext.stage);
      removeNglComponents(nglViewFromContext.stage);
      showProtein(nglViewFromContext.stage, protein.definition, firstTimeShowLigand);
      molsToDisplay = getMoleculeObjects(molsInView, colours, molecules);
      showLigands(nglViewFromContext.stage, molsToDisplay, firstTimeShowLigand);
      showInteractions(nglViewFromContext.stage, molsToDisplay);
    } else if (stage) {
      removeNglComponents(stage);
      showProtein(stage, protein.definition, firstTimeShowLigand);
      molsToDisplay = getMoleculeObjects(molsInView, colours, molecules);
      showLigands(stage, molsToDisplay, firstTimeShowLigand);
      registerStageEvents(stage, getNglView);
      showInteractions(stage, molsToDisplay);
    }

    if (!isStateLoadingFromFile()) {
      handleOrientationChanged();
    }

    if ((molsToDisplay && molsToDisplay.length > 0) || isStateLoadingFromFile()) {
      setFirstTimeShowLigand(false);
    }

    return () => {
      if (stage) {
        unregisterStageEvents(stage, getNglView);
        // unregisterNglView(div_id);
      }
    };
  }, [
    div_id,
    handleResize,
    registerNglView,
    unregisterNglView,
    handleOrientationChanged,
    registerStageEvents,
    unregisterStageEvents,
    stage,
    getNglView,
    protein.definition,
    colours,
    molecules,
    molsInView,
    firstTimeShowLigand,
  ]);
  // End of Initialization NGL View component

  return (
    <div
      className={div_id === VIEWS.MAJOR_VIEW ? classes.paper : undefined}
      id={div_id}
      style={{
        //height: `calc(${height || '600px'} - ${theme.spacing(1)}px)`
        width: '100%',
        height: 'calc(100% - 4px)',
      }}
    />
  );
});

NglView.displayName = 'NglView';
