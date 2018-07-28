'use strict';

var slugify = function slugify(s) {
  return encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));
};

var position = {
  false: 'push',
  true: 'unshift'
};

var hasProp = Object.prototype.hasOwnProperty;

var permalinkHref = function permalinkHref(slug) {
  return '#' + slug;
};

var renderPermalink = function renderPermalink(slug, opts, state, idx) {
  var _state$tokens$childre;

  var space = function space() {
    return Object.assign(new state.Token('text', '', 0), { content: ' ' });
  };

  var linkTokens = [Object.assign(new state.Token('link_open', 'a', 1), {
    attrs: [['class', opts.permalinkClass], ['href', opts.permalinkHref(slug, state)], ['aria-hidden', 'true']]
  }), Object.assign(new state.Token('html_block', '', 0), { content: opts.permalinkSymbol }), new state.Token('link_close', 'a', -1)];

  // `push` or `unshift` according to position option.
  // Space is at the opposite side.
  linkTokens[position[!opts.permalinkBefore]](space());
  (_state$tokens$childre = state.tokens[idx + 1].children)[position[opts.permalinkBefore]].apply(_state$tokens$childre, linkTokens);
};

var uniqueSlug = function uniqueSlug(slug, slugs) {
  var uniq = slug;
  var i = 2;
  while (hasProp.call(slugs, uniq)) {
    uniq = slug + '-' + i++;
  }slugs[uniq] = true;
  return uniq;
};

var isLevelSelectedNumber = function isLevelSelectedNumber(selection) {
  return function (level) {
    return level >= selection;
  };
};
var isLevelSelectedArray = function isLevelSelectedArray(selection) {
  return function (level) {
    return selection.includes(level);
  };
};

var anchor = function anchor(md, opts) {
  opts = Object.assign({}, anchor.defaults, opts);

  md.core.ruler.push('anchor', function (state) {
    var slugs = {};
    var tokens = state.tokens;

    var isLevelSelected = Array.isArray(opts.level) ? isLevelSelectedArray(opts.level) : isLevelSelectedNumber(opts.level);

    tokens.filter(function (token) {
      return token.type === 'heading_open';
    }).filter(function (token) {
      return isLevelSelected(Number(token.tag.substr(1)));
    }).forEach(function (token) {
      // Aggregate the next token children text.
      var title = tokens[tokens.indexOf(token) + 1].children.filter(function (token) {
        return token.type === 'text' || token.type === 'code_inline';
      }).reduce(function (acc, t) {
        return acc + t.content;
      }, '');

      var slug = token.attrGet('id');

      if (slug == null) {
        slug = uniqueSlug(opts.slugify(title), slugs);
        token.attrPush(['id', slug]);
      }

      if (opts.permalink) {
        opts.renderPermalink(slug, opts, state, tokens.indexOf(token));
      }

      if (opts.callback) {
        opts.callback(token, { slug: slug, title: title });
      }
    });
  });
};

anchor.defaults = {
  level: 1,
  slugify: slugify,
  permalink: false,
  renderPermalink: renderPermalink,
  permalinkClass: 'header-anchor',
  permalinkSymbol: '¶',
  permalinkBefore: false,
  permalinkHref: permalinkHref
};

module.exports = anchor;
