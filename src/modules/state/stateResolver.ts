import { doNotSerialize, STATE_KEY } from './stateConfig';

export const resolveState = <T>(reducerName: string, initialState: T): T => {
  const storedStateJson = localStorage.getItem(STATE_KEY);
  const storedState = storedStateJson && JSON.parse(storedStateJson);
  if (
    storedState &&
    Object.prototype.hasOwnProperty.call(storedState, reducerName) &&
    !doNotSerialize.has(reducerName)
  ) {
    return storedState[reducerName];
  }
  return initialState;
};

export const filterOutFromState = <T extends { [key: string]: any }>(state: T): T => {
  const filteredState = { ...state };

  Object.keys(filteredState).forEach((key) => {
    if (doNotSerialize.has(key)) {
      delete filteredState[key];
    }
  });

  return filteredState;
};
