import type { Error } from '@squonk/data-manager-client';
import { useGetProjectFile } from '@squonk/data-manager-client/project';
import type { SavedFile } from '@squonk/react-sci-components/FileSelector';

import type { AxiosError } from 'axios';

export interface SchemaField {
  description: string;
  type: string;
}

export interface Schema {
  description: string;
  fields: Record<string, SchemaField>;
}

export const useGetDatasetSchema = (
  projectId: string | undefined,
  currentFile: SavedFile | undefined,
) => {
  const parts = currentFile?.path.split('/');
  const name = parts?.pop();
  const fileName =
    name === undefined ? '' : name.split('json').slice(0, -1).join('json') + 'schema';
  const path = parts?.join('/') || '/';

  const {
    data: schema,
    isLoading: isSchemaLoading,
    error: schemaError,
  } = useGetProjectFile<Schema, AxiosError<Error>>(
    projectId ?? '',
    {
      file: fileName,
      path,
    },
    {
      query: { enabled: !!(projectId && fileName) },
    },
  );

  return {
    isSchemaLoading,
    schema: schema?.fields,
    schemaError,
  };
};
