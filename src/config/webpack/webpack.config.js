'use strict';

const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const getSectionsConfig = require('./../../utils/get-sections-config');
const DEFAULTS = require('./../../constants.js');

module.exports = (CONFIG, SWANKY_CONFIG) => {
  const BASE_PATH = process.cwd();
  const SECTIONS_CONFIG = getSectionsConfig(SWANKY_CONFIG.sections, SWANKY_CONFIG.meta);
  const THEME_REGEX = new RegExp(`${SWANKY_CONFIG.theme}.*index.styl`);

  const WEBPACK_CONFIG = {
    devtool: CONFIG.devtool,
    context: BASE_PATH,
    entry: {
      theme: [SWANKY_CONFIG.meta.theme + '/index.js']
    },
    output: {
      path: SWANKY_CONFIG.meta.output,
      filename: '[name].[hash:8].bundle.js',
      publicPath: SWANKY_CONFIG.meta.production ? SWANKY_CONFIG.meta.serverPath : '/'
    },
    resolve: {
      extensions: ['.js', '.json', '.styl', '.less', '.scss'],
      descriptionFiles: ['package.json'],
      modules: [BASE_PATH, 'node_modules'],
      mainFiles: ['index'],
      alias: {
        'assets': path.resolve(BASE_PATH, SWANKY_CONFIG.meta.src, 'assets')
      }
    },
    module: {
      loaders: [
        {
          test: DEFAULTS.REGEX.STYLES.CSS,
          loader: ExtractTextPlugin.extract({fallbackLoader: 'style-loader', loader: 'css-loader'})
        },
        {
          test: DEFAULTS.REGEX.STYLES.LESS,
          loader: ExtractTextPlugin.extract({fallbackLoader: 'style-loader', loader: 'css-loader!less-loader'})
        },
        {
          test: DEFAULTS.REGEX.STYLES.SASS,
          loader: ExtractTextPlugin.extract({fallbackLoader: 'style-loader', loader: 'css-loader!sass-loader'})
        },
        {
          test: THEME_REGEX,
          loader: ExtractTextPlugin.extract({fallbackLoader: 'style-loader', loader: `css-loader?modules&localIdentName=${SWANKY_CONFIG.meta.cssScopedName}!stylus-loader`})
        },
        {
          test: DEFAULTS.REGEX.STYLES.STYLUS,
          exclude: THEME_REGEX,
          loader: ExtractTextPlugin.extract({fallbackLoader: 'style-loader', loader: 'css-loader!stylus-loader'})
        },
        {
          test: DEFAULTS.REGEX.LANGUAGE.JS,
          loaders: 'babel-loader',
          exclude: /node_modules/,
          query: {
            presets: ['es2015']
          }
        },
        {
          test: DEFAULTS.REGEX.LANGUAGE.HTML,
          loader: 'html-loader'
        },
        {
          test: DEFAULTS.REGEX.ASSETS.FONTS,
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'assets/fonts/[name].[hash:7].[ext]'
          }
        },
        {
          test: DEFAULTS.REGEX.ASSETS.IMAGES,
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'assets/img/[name].[hash:7].[ext]'
          }
        }
      ]
    },
    plugins: [
      new webpack.NoErrorsPlugin(),
      new ExtractTextPlugin({filename: '[name].[hash:8].css', disable: false, allChunks: true, publicPath: BASE_PATH}),
      new webpack.LoaderOptionsPlugin({
        options: {
          swankyDocs: {
            sections: SECTIONS_CONFIG
          },
          swankyDocsLoader: {
            layouts: SWANKY_CONFIG.meta.layouts,
            partials: SWANKY_CONFIG.meta.partials
          }
        }
      })
    ]
  };

  // HMR
  if (!SWANKY_CONFIG.meta.production) {
    WEBPACK_CONFIG.entry.docs = [
      require.resolve('webpack/hot/dev-server'),
      require.resolve('webpack-hot-middleware/client'),
      SWANKY_CONFIG.meta.src + '/docs.js'
    ];
  } else {
    WEBPACK_CONFIG.entry.docs = [SWANKY_CONFIG.meta.src + '/docs.js'];
  }

  // Snippets
  if (SWANKY_CONFIG.snippets) {

    // Make sure we have a folder as well
    if (fs.existsSync(SWANKY_CONFIG.snippets)) {
      // Add an entry point to bootstrap snippets
      const loader = require.resolve('./../../loaders/bootstrap-loader');
      const template = path.join(__dirname, './../../loaders/bootstrap-loader/bootstrap-loader-template.js');

      WEBPACK_CONFIG.entry['snippets'] = `${loader}?src=${SWANKY_CONFIG.snippets}!${template}`;
    }
  }

  SECTIONS_CONFIG.forEach((page, index) => {
    // Create dynamic entry points for page specific scripts
    if (page.bootstrap && page.bootstrap.length > 0) {
      WEBPACK_CONFIG.entry[page.key] = page.bootstrap;
    }

    // Create an instance of the HTML Webpack Plugin for each page
    WEBPACK_CONFIG.plugins = WEBPACK_CONFIG.plugins.concat(new HtmlWebpackPlugin({
      key: page.key,
      chunks: ['docs', 'theme'].push(WEBPACK_CONFIG.entry[page.key] ? WEBPACK_CONFIG.entry[page.key] : ''),
      filename: !index ? 'index.html' : page.url,
      favicon: `${SWANKY_CONFIG.meta.src}/favicon.ico`,
      template: '!!' + 'html-loader!' + require.resolve('./../../loaders/swanky-docs-loader') + '?key=' + page.key + '!' + page.layoutSrc,
      inject: true
    }));
  });

  // Plugins
  CONFIG.plugins.forEach((plugin) => {
    WEBPACK_CONFIG.plugins.push(plugin);
  });

  return WEBPACK_CONFIG;
};