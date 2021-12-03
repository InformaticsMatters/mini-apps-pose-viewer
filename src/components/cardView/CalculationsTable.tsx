import React from 'react';

import { Table, TableBody, TableCell, TableRow, Tooltip, Typography } from '@material-ui/core';
import styled from 'styled-components';

interface IProps {
  properties: { name: string; value: number | string }[];
  tableWidth?: number;
  calcs?: { [key: string]: string };
  blacklist?: string[];
  fontSize?: number | string;
}

const CalculationsTable = ({
  calcs,
  blacklist = [],
  properties,
  fontSize,
  tableWidth,
}: Readonly<IProps>) => {
  return (
    <Table>
      <TableBody>
        {properties
          .filter((property) => !blacklist.includes(property.name))
          .map(({ name, value }, index) => {
            if (typeof value === 'number') {
              value = +value.toFixed(2); // Round to 2 sig fig and remove pad.
            }
            const displayName = calcs?.[name] ?? name;
            return (
              <TableRow key={index}>
                <CellTh
                  component="th"
                  fontSize={fontSize}
                  style={{ maxWidth: tableWidth ? `calc(${tableWidth - 32}px - 35px)` : '5rem' }}
                >
                  <Tooltip arrow title={displayName}>
                    <span>{displayName}</span>
                  </Tooltip>
                </CellTh>
                <CellTd align="left" fontSize={fontSize}>
                  <Tooltip arrow title={value}>
                    <CellText noWrap fontSize={fontSize}>
                      {value}
                    </CellText>
                  </Tooltip>
                </CellTd>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
};

export default CalculationsTable;

type CellExtraProps = { fontSize: number | string | undefined };

const Cell = styled(TableCell)<CellExtraProps>`
  font-size: ${({ fontSize }) => fontSize};
  padding-top: ${({ theme }) => theme.spacing(0.5)}px;
  padding-bottom: ${({ theme }) => theme.spacing(0.5)}px;
  padding-right: 0;
  padding-left: 0;
`;

const CellTd = styled(Cell)`
  width: 100%;
  padding-left: ${({ theme }) => theme.spacing(1)}px;
`;

const CellTh = styled(Cell)`
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CellText = styled(Typography)<CellExtraProps>`
  font-size: inherit; /* Inherit from Cell */
  width: 32px;
  min-width: 100%;
`;
