import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import './store'; // Must be imported before hooks4redux which otherwise implicitly creates a store
import 'resize-observer-polyfill';

import App from './App';
import * as serviceWorker from './serviceWorker';
import { SquonkTheme } from '@squonk/react-sci-components';

import { Provider } from 'hooks-for-redux';

const render = () => {
  ReactDOM.render(
    <Provider>
      <SquonkTheme>
        <App />
      </SquonkTheme>
    </Provider>,
    document.getElementById('root'),
  );
};

render();

// Hot reloading for testing of css/display changes
// May cause weirdness
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./App', render);
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
