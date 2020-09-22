const { useBabelRc, override, addWebpackAlias } = require('customize-cra');
const path = require('path');

module.exports = override(
  useBabelRc(),
  addWebpackAlias({
    'styled-components': path.resolve(path.join(__dirname, './node_modules/styled-components')),
  }),
  addWebpackAlias({
    '@material-ui/core': path.resolve(path.join(__dirname, './node_modules/@material-ui/core')),
  }),
  addWebpackAlias({
    'hooks-for-redux': path.resolve(path.join(__dirname, './node_modules/hooks-for-redux')),
  }),
  addWebpackAlias({
    react: path.resolve(path.join(__dirname, './node_modules/react')),
  }),
  addWebpackAlias({
    '@react-keycloak/web': path.resolve(path.join(__dirname, './node_modules/@react-keycloak/web')),
  }),
);
