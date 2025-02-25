import React, { useState } from 'react';

import { IconButton, Tooltip } from '@material-ui/core';
import PublishRoundedIcon from '@material-ui/icons/PublishRounded';
import { DropzoneDialog } from 'material-ui-dropzone';

import { useStoreState } from '../../hooks/useStoreState';
import { STATE_KEY } from '../../modules/state/stateConfig';
import { filterOutFromState } from '../../modules/state/stateResolver';
import DownloadButton from '../DownloadButton';

const STATE_VERSION = '4.0.0';

const StateManagement: React.FC = () => {
  const state = useStoreState();

  const dump = JSON.stringify({
    __version__: STATE_VERSION,
    ...filterOutFromState(state),
  });

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  return (
    <>
      <DownloadButton dump={dump} filename={'name.json'} tooltip={'Download State as json'} />
      <Tooltip arrow title="Upload saved state">
        <IconButton aria-label="upload json state" onClick={() => setUploadDialogOpen(true)}>
          <PublishRoundedIcon />
        </IconButton>
      </Tooltip>
      <DropzoneDialog
        filesLimit={1}
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
        }}
        onSave={async (files: File[]) => {
          const txt = await files[0].text();
          localStorage.setItem(STATE_KEY, txt);
          window.location.reload();
          setUploadDialogOpen(false);
        }}
      />
    </>
  );
};

export default StateManagement;
