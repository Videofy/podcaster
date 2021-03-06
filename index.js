
var path = require('path');
var debug = require('debug')('monstercat-podcast');
var async = require('async');
var Rss = require('rss');
var globs = require('./lib/globs');
var resolve = require('./lib/resolve');
var parse = require('./lib/parse');
var extend = require('xtend');

var exports = module.exports = podcast;

/**
 * listify :: Either a [a] -> [a]
 */

exports.listify = function(items){
  var array = Array.isArray(items);
  return array? items : items? [items] : null;
};


/**
 * config and items to rss
 *
 * @param {Object} config
 * @param {Array} array of podcast items
 * @return {String} rss data
 * @api public
 */
exports.rss = function(config, items){
  var feed = new Rss(config);
  items.forEach(function(item){
    debug("feeding item %j", item);
    feed.item(item);
  });
  return feed.xml(" ");
};

/**
 * Take a config path and build an rss feed
 *
 * @param {String} yaml config path
 * @param {Function} result callback (err, rss_data)
 * @api public
 */

function podcast(filename, done) {
  debug('reading config...');
  parse(filename, function(err, config){
    if (err) return done(err);

    debug('config: %j', config);
    var items = exports.listify(config.items || "podcast/**/*.json");
    items = items.map(resolve.bind(null, filename));

    globs(items, function(err, files){
      debug('globbed: %j', files);
      if (err) return done(err);

      async.map(files, parse, function(err, items){
        if (err) return done(err);
        var defs = !!config.itemDefaults;
        debug("has item defaults? %s", defs);
        items = items.map(function(item){
          return defs? extend(item, config.itemDefaults) : item;
        });

        return done(err, {
          config: config,
          items: items,
          xml: exports.rss(config, items)
        });
      });
    });
  });
}

