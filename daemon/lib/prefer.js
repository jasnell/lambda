'use strict';

function parser(input) {
  var collector = [];
  var current = '', quoted = false;
  for (var n = 0, l = input.length; n < l; n++) {
    if (input[n] === ',' && !quoted) {
      if (current.trim().length > 0)
        collector.push(current.trim());
      current = '';
    } else if (input[n] === '"' && !quoted) {
      //current += input[n];
      quoted = true;
    } else if (input[n] === '"' && quoted) {
      //current += input[n];
      quoted = false;
    } else {
      current += input[n];
    }
  }
  if (current.trim().length > 0)
    collector.push(current.trim());
  return collector;
}

function prefer(req, res, next) {
  var pref = req.get('Prefer');
  req.prefer = {};
  if (pref !== undefined) {
    var tokens = parser(pref);
    tokens.forEach(function(item) {
      var split = item.split('=',2);
      var value = split[1] || true;
      req.prefer[split[0].toLowerCase()] = value;
    });
  }
  next();
}

module.exports = prefer;
