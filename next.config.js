const withCSS = require('@zeit/next-css');
const withGraphql = require('next-plugin-graphql');

/* Without CSS Modules, with PostCSS */
// module.exports = withCSS()

/* With CSS Modules */
module.exports = withGraphql(withCSS({ cssModules: true }));

/* With additional configuration on top of CSS Modules */
/*
module.exports = withCSS({
  cssModules: true,
  webpack: function (config) {
    return config;
  }
});
*/
