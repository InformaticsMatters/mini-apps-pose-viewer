import React, { useState } from 'react';
import { CSSGrid, enterExitStyle } from 'react-stonecutter';

import { Button, Grow } from '@material-ui/core';
import type { Theme } from '@material-ui/core/styles';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import styled from 'styled-components';

import type { Molecule } from '../../modules/molecules/molecules';
import { useMolecules } from '../../modules/molecules/molecules';
import { usePlotSelection } from '../scatterplot/plotSelection';
import CalculationsTable from './CalculationsTable';
import type { CardActionsState } from './cardActions';
import { clearColours, setColours, toggleSelected, useCardActions } from './cardActions';
import { useCardViewConfiguration } from './cardViewConfiguration';
import ColourPicker from './ColourPicker';
import MolCard from './MolCard';

const { enter, entered, exit } = enterExitStyle.fromLeftToRight;
const CARDS_PER_PAGE = 25;
const GRID_PADDING = 2; // theme spacing units
const MIN_CARD_WIDTH = 144; //px === 9rem
const GUTTER_SIZE = 16; // px === 1rem

const moleculeSorter =
  ({ colours }: CardActionsState) =>
  (ma: Molecule, mb: Molecule) => {
    const ca = colours.find(({ id }) => id === ma.id);
    const cb = colours.find(({ id }) => id === mb.id);

    if (ca && !cb) {
      return -1;
    } else if (ca && cb) {
      return 0;
    } else if (!ca && cb) {
      return 1;
    }
    return 0;
  };

const palette = {
  red: '#ff0000',
  blue: '#0000ff',
  yellow: 'yellow',
  cyan: 'cyan',
  lime: 'lime',
  orange: 'orange',
};

// Need to pass styles for action render prop
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    // Positioning of buttons in card
    actionsRoot: {
      position: 'absolute',
      top: -theme.spacing(1),
      left: 0,
      right: 0,
      justifyContent: 'center',
    },
  }),
);
interface IProps {
  width: number;
}

const CardView = ({ width }: IProps) => {
  const classes = useStyles();
  const theme = useTheme();

  const [loadMoreCount, setLoadMoreCount] = useState(1);

  const { molecules, fields: moleculesFields } = useMolecules();

  const selectedMoleculesIds = usePlotSelection();
  const actions = useCardActions();
  const { selectedIds, colours } = actions;
  const { fields, fieldForDepiction } = useCardViewConfiguration();

  const enabledFields = fields.filter((field) => field.isVisible).map((field) => field.name);

  const displayMolecules = molecules.filter(({ id }) => {
    const isSelected = selectedMoleculesIds.includes(id);
    const isColoured = colours.filter(({ id: cid }) => cid === id)[0];
    return isSelected || isColoured;
  });

  // Calculate dimensions of card for stonecutter grid
  const gridWidth = width - 2 * theme.spacing(GRID_PADDING); // padding removed
  const numColumns = Math.floor(gridWidth / MIN_CARD_WIDTH);

  let cardWidth: number;
  if (numColumns > 1) {
    cardWidth = (gridWidth - (numColumns - 1) * GUTTER_SIZE) / numColumns;
  } else {
    cardWidth = gridWidth;
  }

  const imageSize = cardWidth - 2 * theme.spacing(2);
  const cardHeight =
    imageSize + enabledFields.length * 22.9 + 2 * theme.spacing(2) + theme.spacing(1);

  // Need to specify the height and width in the card for the grid to work in safari
  const cardStyles = makeStyles({
    root: { height: cardHeight },
  })();

  const ms = displayMolecules
    .sort(moleculeSorter(actions))
    .splice(0, CARDS_PER_PAGE * loadMoreCount);

  return (
    <GridWrapper>
      <Grid
        columns={numColumns}
        columnWidth={cardWidth}
        duration={200}
        enter={enter}
        entered={entered}
        exit={exit}
        gutterHeight={GUTTER_SIZE}
        gutterWidth={GUTTER_SIZE}
        itemHeight={cardHeight}
      >
        {ms.map(({ id, fields: fieldValues }, index) => {
          let smiles = fieldValues.find((field) => field.name === fieldForDepiction)?.value;
          if (typeof smiles !== 'string') {
            smiles = '';
          }
          fieldValues.sort(
            (a, b) =>
              fields.findIndex((f) => f.name === a.name) -
              fields.findIndex((f) => f.name === b.name),
          );
          const selected = selectedIds.includes(id);
          return (
            <div key={index} style={{ width: cardWidth, height: cardHeight }}>
              <MolCard
                actions={(hover) => {
                  const colour = colours.find((c) => c.id === id);
                  return (
                    <Grow in={hover || colour !== undefined}>
                      <span>
                        <ColourPicker
                          clearColour={() => clearColours(id)}
                          colours={palette}
                          enabled={!!hover}
                          iconColour={colour?.colour}
                          setColour={(colour) => setColours({ id, colour })}
                        />
                      </span>
                    </Grow>
                  );
                }}
                actionsProps={{ className: classes.actionsRoot }}
                bgColor={selected ? theme.palette.grey[100] : undefined}
                classes={{ root: cardStyles.root }}
                depictHeight={imageSize}
                depictWidth={imageSize}
                elevation={selected ? 10 : undefined}
                smiles={smiles}
                onClick={() => toggleSelected(id)}
              >
                <CalculationsTable
                  fontSize={'0.6rem'}
                  properties={fieldValues
                    .filter(({ name }) => enabledFields.includes(name))
                    .map(({ name, nickname, value }) => ({
                      nickname,
                      value: value ?? '',
                      name: moleculesFields.find((f) => f.name === name)?.nickname ?? name,
                    }))}
                  tableWidth={cardWidth}
                />
              </MolCard>
            </div>
          );
        })}
      </Grid>
      {!!(CARDS_PER_PAGE * loadMoreCount < selectedMoleculesIds.length) && (
        <Button color="default" variant="text" onClick={() => setLoadMoreCount(loadMoreCount + 1)}>
          Load More
        </Button>
      )}
    </GridWrapper>
  );
};

const Grid = styled(CSSGrid)`
  margin-bottom: 1rem;
`;

// Scrolling and height of grid region
const GridWrapper = styled.div`
  /* Height of elements above the grid */
  height: calc(100vh - ${({ theme }) => 2 * theme.spacing(2)}px);
  padding: ${({ theme }) => theme.spacing(2)}px;
  overflow-y: scroll;
  text-align: center;
`;

export default CardView;
