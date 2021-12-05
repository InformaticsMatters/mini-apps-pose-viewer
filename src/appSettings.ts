// Load settings that need to be defined at runtime rather than build time
import get from 'lodash/get';

const VARS = ['DATA_MANAGER_API_SERVER', 'GANALYTICS_ID'];

const fetchConfig = () => {
  try {
    const request = new XMLHttpRequest();
    // Loads the config.json file in the public folder
    // ! Should find a better way to do this
    request.open('GET', process.env.PUBLIC_URL + '/config.json', false); // `false` makes the request synchronous
    request.send(null);
    if (request.status === 200) {
      const config = JSON.parse(request.responseText);
      const env: { [key: string]: string } = {};
      VARS.forEach((v) => {
        const val = get(process.env, `REACT_APP_${v}`);
        if (val !== undefined) {
          env[v] = val;
        }
      });
      return {
        ...config,
        ...env,
      };
    }
  } catch (error) {
    console.error('No config.json found');
    console.error(error);
    // config.json not found or could not be parsed
  }
};

export default {
  ...fetchConfig(),
};
