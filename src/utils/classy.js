'use strict';

// all available html tags
const tagRegex = /<(\w+)(?:\s*(?:\w*="([^"]+)")?)>/g;

/**
 * Convert html tags to contain a css modules class variable
 * @description showdown js custom extension - https://github.com/showdownjs/showdown
 * @tutorial https://github.com/showdownjs/showdown/wiki/extensions#filter-property
 * @returns {Array} - modified html tag
 */

let classy = () => {
  return [{
    type: 'output', // output extensions (or modifiers) alter the HTML output generated by showdown
    filter: (text) => { // filter property should be a function that acts as a callback
      return text.replace(tagRegex, (match, tag, classes) => {
        return `<${tag} class="${classes ? classes + ' ' : ''}{$ styles.${tag} $}">`;
      });
    }
  }];
};

module.exports = classy;
