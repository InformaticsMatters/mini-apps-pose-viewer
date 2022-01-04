const path = require('path');
const fs = require('fs');
const cracoBabelLoader = require('craco-babel-loader');

// manage relative paths to packages
const appDirectory = fs.realpathSync(process.cwd());
const resolvePackage = (relativePath) => path.resolve(appDirectory, relativePath);

const config = {
  plugins: [
    {
      plugin: cracoBabelLoader,
      options: {
        includes: [resolvePackage('./node_modules/@squonk/react-sci-components')],
      },
    },
  ],
  webpack: {
    alias: {
      react: path.resolve(path.join(__dirname, './node_modules/react')),
      'react-query': path.resolve(path.join(__dirname, './node_modules/react-query')),
      '@material-ui/core': path.resolve(path.join(__dirname, './node_modules/@material-ui/core')),
      '@squonk/data-manager-client': path.resolve(
        path.join(__dirname, './node_modules/@squonk/data-manager-client'),
      ),
    },
    configure: (webpackConfig, { env, paths }) => {
      webpackConfig.module.rules[1].oneOf[2].include = [
        resolvePackage(
          resolvePackage(fs.realpathSync('node_modules/@squonk/react-sci-components/src')),
        ),
        resolvePackage('src'),
      ];
      // throw Error()
      return webpackConfig;
    },
  },
};

module.exports = {};

if (process.env.MONOREPO) module.exports = config;
