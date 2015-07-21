'use strict';

// var BasicStrategy = require('passport-http').BasicStrategy;
//
// exports.auth = new BasicStrategy(
//   function(username, password, done) {
//     if (username) {
//       done(null,{username:username});
//     } else {
//       done('error');
//     }
//   }
// );

exports.handler = function(input, context) {
  context.succeed({'Hello':'World'});
};
