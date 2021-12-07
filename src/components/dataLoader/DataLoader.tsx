import React, { useRef, useState } from 'react';

import type { ProjectDetail } from '@squonk/data-manager-client';
import { useGetProjects } from '@squonk/data-manager-client/project';
import type { SavedFile } from '@squonk/react-sci-components/FileSelector';
import { FileSelector } from '@squonk/react-sci-components/FileSelector';

import {
  Button,
  CircularProgress,
  Divider as MuiDivider,
  FormGroup,
  LinearProgress,
  TextField,
  Typography,
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { useGetDatasetSchema } from 'hooks/useGetDatasetSchema';
import styled from 'styled-components';

import type { SourceConfig } from './configs';
import { addConfig } from './configs';
import { useSourceConfigs } from './configs';
import FieldConfiguration from './FieldConfiguration';
import { getDataFromForm, getProject } from './utils';
import { setWorkingSource, useWorkingSource } from './workingSource';

interface IProps {
  title: string;
  mimeType?: string;
  enableConfigs: boolean;
  loading?: boolean;
  error?: string | null;
  totalParsed?: number;
  moleculesKept?: number;
}

const DataLoader: React.FC<IProps> = ({
  title,
  mimeType,
  enableConfigs,
  loading,
  error,
  totalParsed,
  moleculesKept,
}) => {
  const formRef = useRef<HTMLFormElement>(null!);

  const configs = useSourceConfigs();
  const [selectedConfig, setSelectedConfig] = useState<SourceConfig | null>(null);

  const currentSources = useWorkingSource();
  const currentSource =
    selectedConfig ?? currentSources.find((slice) => slice.title === title)?.state ?? null;

  const {
    data: projectsData,
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useGetProjects();
  const projects = projectsData?.projects;
  // eslint-disable-next-line prefer-const
  let [currentProject, setCurrentProject] = useState<ProjectDetail | undefined>();
  currentProject = currentProject ?? getProject(projects ?? [], currentSource?.projectId);

  const [currentFile, setCurrentFile] = useState<SavedFile | undefined>(currentSource?.file);

  const { isSchemaLoading, schema, schemaError } = useGetDatasetSchema(
    currentProject?.project_id,
    mimeType === 'chemical/x-pdb' ? undefined : currentFile,
  );

  const metadata = Object.entries(schema ?? {}).map(([key, value]) => ({
    name: key,
    type: value.type,
  }));

  const handleAction = (mode: string) => () => {
    const projectId = currentProject?.project_id;
    if (currentFile !== undefined && projectId !== undefined) {
      const formData =
        enableConfigs && schema !== undefined
          ? getDataFromForm(
              formRef.current,
              metadata.map(({ name }) => name),
            )
          : {};
      if (mode === 'load') {
        setWorkingSource({
          title,
          state: { ...formData, projectId, file: currentFile },
        });
      } else if (mode === 'save' && enableConfigs) {
        const configName = formRef.current['configName'].value as string;
        configName && addConfig({ file: currentFile, projectId, configName, ...formData });
      }
    }
  };

  return (
    <form
      key={`${currentSource?.file.path}-${selectedConfig?.id}`}
      // update defaultValue of fields when currentSource changes
      ref={formRef}
    >
      <SourcesWrapper>
        <Autocomplete
          fullWidth
          getOptionLabel={(option) => option.name}
          id="project-selection"
          loading={isProjectsLoading}
          options={projects ?? []}
          renderInput={(params) => (
            <TextField
              color="secondary"
              {...params}
              error={!!projectsError}
              label={projectsError || 'Select project'}
              variant="outlined"
            />
          )}
          value={currentProject ?? null}
          onChange={(_, newProject) => {
            setSelectedConfig(null);
            setCurrentFile(undefined);
            setCurrentProject(newProject ?? undefined);
          }}
        />

        <FileSelector
          disabled={!currentProject}
          extensions={mimeType === 'chemical/x-pdb' ? ['.pdb'] : ['.json']}
          mimeTypes={mimeType !== undefined ? [mimeType] : []}
          multiple={false}
          projectId={currentProject?.project_id}
          targetType="file"
          value={currentFile !== undefined ? [currentFile] : []}
          onSelect={(savedFiles) => {
            setCurrentFile(savedFiles[0]);
          }}
        />
      </SourcesWrapper>

      <SourceRowTwo row>
        {enableConfigs && (
          <>
            <TextField
              color="secondary"
              defaultValue={currentSource?.maxRecords ?? 500}
              inputProps={{ min: 0, step: 100 }}
              label="Max. Records"
              name="maxRecords"
              size="small"
              type="number"
              variant="outlined"
            />
            {totalParsed !== undefined && moleculesKept !== undefined && (
              <Typography>
                <strong>{moleculesKept}</strong> loaded. <strong>{totalParsed}</strong> parsed.
              </Typography>
            )}
          </>
        )}
        <Button
          color="primary"
          disabled={currentFile === undefined || isSchemaLoading || loading}
          variant="contained"
          onClick={handleAction('load')}
        >
          Load
          {loading && <Progress size={24} />}
        </Button>
      </SourceRowTwo>

      {enableConfigs && (
        <>
          <Divider />

          <FieldsWrapper>
            <Typography variant="h6">Field Configuration</Typography>
            {isSchemaLoading ? (
              <LinearProgress color="secondary" />
            ) : !!schemaError || !!error ? (
              <>
                {schemaError && <Typography>{schemaError.message}</Typography>}
                {error && <Typography>{error}</Typography>}
              </>
            ) : (
              <FieldConfiguration currentSource={currentSource} metadata={metadata} />
            )}
          </FieldsWrapper>

          <Divider />

          <ConfigSaveFormGroup row>
            <Autocomplete
              freeSolo
              handleHomeEndKeys
              getOptionLabel={(option) => option.configName}
              options={configs.filter((config) => config.file.path === currentFile?.path)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  color="secondary"
                  name="configName"
                  placeholder="Config Name"
                  variant="outlined"
                />
              )}
              size="small"
              value={selectedConfig}
              onChange={(_, newValue) =>
                typeof newValue !== 'string' && newValue !== null && setSelectedConfig(newValue)
              }
            />
            <Button
              color="primary"
              variant="outlined"
              // onClick={handleAction('save')}
            >
              Save
            </Button>
          </ConfigSaveFormGroup>
        </>
      )}
    </form>
  );
};

export default DataLoader;

const SourcesWrapper = styled.div`
  & > div {
    margin-bottom: ${({ theme }) => theme.spacing(1)}px;
    margin-top: ${({ theme }) => theme.spacing(1) / 1.5}px;
  }
`;

const SourceRowTwo = styled(FormGroup)`
  justify-content: space-between;
  align-items: baseline;
  margin-top: ${({ theme }) => theme.spacing(1)}px;
  margin-bottom: ${({ theme }) => theme.spacing(2)}px;
`;

const FieldsWrapper = styled.div`
  height: calc(80vh - 345px);
  overflow-y: scroll;
  text-align: center;
`;

const Divider = styled(MuiDivider)`
  margin-top: ${({ theme }) => theme.spacing(1)}px;
  margin-bottom: ${({ theme }) => theme.spacing(1)}px;
`;

// TODO: Make reusable @ref LoginButton.tsx
const Progress = styled(CircularProgress)`
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -12px;
  margin-left: -12px;
`;

const ConfigSaveFormGroup = styled(FormGroup)`
  margin-top: ${({ theme }) => theme.spacing(2)}px;
  > div:first-child {
    width: 15rem;
    margin-right: ${({ theme }) => theme.spacing(2)}px;
  }
`;
