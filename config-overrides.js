const { override, addWebpackAlias } = require('customize-cra');
const path = require('path');

module.exports = override(
  addWebpackAlias({
    react: path.resolve(path.join(__dirname, './node_modules/react')),
  }),
  addWebpackAlias({
    'react-query': path.resolve(path.join(__dirname, './node_modules/react-query')),
  }),
  addWebpackAlias({
    '@material-ui/core': path.resolve(path.join(__dirname, './node_modules/@material-ui/core')),
  }),
  addWebpackAlias({
    '@squonk/data-manager-client': path.resolve(path.join(__dirname, './node_modules/@squonk/data-manager-client')),
  }),
);
