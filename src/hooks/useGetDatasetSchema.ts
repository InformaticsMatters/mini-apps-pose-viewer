import { useEffect, useState } from 'react';

import { useGetProjectFile } from '@squonk/data-manager-client/project';
import type { SavedFile } from '@squonk/react-sci-components/FileSelector';

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
    data,
    isLoading: isSchemaLoading,
    error: schemaError,
  } = useGetProjectFile<Blob>(
    projectId ?? '',
    {
      file: fileName,
      path,
    },
    {
      query: { enabled: !!(projectId && fileName) },
    },
  );

  const [schema, setSchema] = useState<Schema>();

  useEffect(() => {
    const func = async () => {
      const text = await data?.text();
      text && setSchema(JSON.parse(text).detail);
    };
    func();
  }, [data]);

  return {
    isSchemaLoading,
    schema: schema?.fields,
    schemaError: undefined as any,
  };
};
