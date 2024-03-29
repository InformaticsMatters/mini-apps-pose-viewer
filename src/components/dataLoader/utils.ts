import type { ProjectDetail } from '@squonk/data-manager-client';

export const getProject = (projects: ProjectDetail[], projectId?: string) =>
  projects.find((project) => project.project_id === projectId);

const getFieldFromForm = (form: HTMLFormElement) => (fieldName: string) => {
  const min = form[`${fieldName}-min`]?.value;
  const max = form[`${fieldName}-max`]?.value;
  const dtype = form[`${fieldName}-dtype`]?.value;
  const isNumeric = dtype === 'int' || dtype === 'float';

  const enabled = form[`${fieldName}-enabled`]?.checked;

  return enabled
    ? {
        name: fieldName,
        nickname: form[`${fieldName}-nickname`]?.value,
        dtype,
        min: isNumeric && min !== '' ? Number(min) : undefined,
        max: isNumeric && max !== '' ? Number(max) : undefined,
      }
    : null;
};

export const getDataFromForm = (form: HTMLFormElement, fieldNames: string[]) => {
  const target = form as typeof form & { [key: string]: { value: string } };

  const maxRecords = Number(target.maxRecords.value);
  const getter = getFieldFromForm(form);
  const configs = fieldNames
    .map((fieldName) => getter(fieldName))
    .filter((config) => config !== null);

  return { maxRecords, configs };
};
