import React, { useState } from 'react';
import type { DropResult } from 'react-smooth-dnd';

import {
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from '@material-ui/core';
import styled from 'styled-components';

import DraggableList from '../DraggableList';
import { getDisplayText } from '../utils';
import {
  moveFieldPosition,
  setDepictionField,
  toggleFieldIsEnabled,
  useCardViewConfiguration,
} from './cardViewConfiguration';
interface IProps {
  title: string;
}

/**
 * Configuration options for the card view component in the pose-viewer
 * @param title used for setting ids for this card view and avoid id conflicts (a11y)
 */
const CardViewConfig = ({ title }: IProps) => {
  const { fields, fieldForDepiction } = useCardViewConfiguration();
  const enabledFields = fields.filter((field) => field.isVisible).map((field) => field.name);

  const depictionSelectionId = `${title}-depiction-field-selection`;

  const [showHidden, setShowHidden] = useState(true);

  const displayFields = fields.filter(({ name }) => enabledFields.includes(name) || showHidden);

  const handleMoveFieldPosition = ({ removedIndex, addedIndex }: DropResult) => {
    // Need to handle indexes different if fields are hidden
    if (showHidden) {
      moveFieldPosition({ removedIndex, addedIndex });
    } else if (removedIndex !== null && addedIndex !== null) {
      const removedField = displayFields[removedIndex];
      const addedField = displayFields[addedIndex];

      const fixedRemovedIndex = fields.indexOf(removedField);
      const fixedAddedIndex = fields.indexOf(addedField);

      moveFieldPosition({
        removedIndex: fixedRemovedIndex,
        addedIndex: fixedAddedIndex,
      });
    }
  };

  return (
    <>
      <DepictionFieldWrapper>
        <Typography display="inline" variant="h6">
          Depiction Field
        </Typography>
        <FormControl>
          <InputLabel id={depictionSelectionId}>Depiction Field Selection</InputLabel>
          <Select
            labelId={depictionSelectionId}
            value={fieldForDepiction ?? ''}
            onChange={({ target: { value } }) => setDepictionField(value as string)}
          >
            {fields.map(({ name, ...rest }, index) => (
              <MenuItem key={index} value={name}>
                {getDisplayText({ name, ...rest })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DepictionFieldWrapper>
      <ListHeader>
        <Tooltip arrow title={'Toggle visibility of disabled fields'}>
          <Checkbox checked={showHidden} onClick={() => setShowHidden(!showHidden)} />
        </Tooltip>
        <Typography display="inline" variant="subtitle1">
          <strong>Hidden Field Visibility</strong>
        </Typography>
      </ListHeader>
      <DraggableList
        checked={displayFields.map(({ name }) => enabledFields.includes(name))}
        fields={displayFields.map(({ title, name, dtype }) => ({
          name,
          title: getDisplayText({ title, name, dtype }),
        }))}
        moveFieldPosition={handleMoveFieldPosition}
        toggleCheckbox={(selectedTitle) => {
          const name = displayFields.find(({ title: t }) => t === selectedTitle)?.name;
          if (name !== undefined) {
            toggleFieldIsEnabled(name);
          }
        }}
      />
    </>
  );
};

export default CardViewConfig;

const DepictionFieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ theme }) => theme.spacing(2)}px;
`;

const ListHeader = styled.div`
  display: flex;
  align-items: center;
`;
