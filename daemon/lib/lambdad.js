/**
 * Each lambda daemon presents a simple HTTP API.
 *   HTTP GET to root (/) will redirect to /info, returning information about
 *     the lambda function.
 *   HTTP POST to used to invoke the lambda by passing data in.
 *     if the client requests an asynchronous response, a request ID
 *     will be returned, along with a redirect to the status URI
 *   HTTP OPTIONS is used to enable CORS-preflight
 **/
'use strict';

var util = require('util');
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var Anonymous = require('passport-anonymous');
var Context = require('./context');
var prefer = require('./prefer');
var lambda = require('../lambda');

var name = process.env.LAMBDA_NAME || '(anonymous)';
//var host = process.env.VCAP_APP_HOST || 'localhost';
var port = process.env.VCAP_APP_PORT || 8080;
var timeout = parseInt(process.env.LAMBDA_TIMEOUT) || 10 * 1000;
// TODO: Proxy configuration from env

// init express
var app = express();
app.use(passport.initialize());
app.use(prefer);
app.use(bodyParser.json({
  limit: '1024kb'
}));
app.use(bodyParser.json({
  limit: '1024kb',
  type: 'application/*+json'
}));
app.use(bodyParser.urlencoded({ extended: true }));

passport.use('auth', lambda.auth || new Anonymous());

var stats = {
  count: 0,
  success: {
    count: 0,
    avg: 0.0
  },
  fail: {
    count: 0,
    avg: 0.0
  },
  cancel: {
    count: 0,
    avg: 0.0
  },
};
function report(context,type) {
  var end = process.hrtime(context.start);
  var mil = (end[0] * 1e9 + end[1]) / 1000000;
  stats[type].count++;
  var cma = stats[type].avg;
  stats[type].avg = cma + ((mil-cma)/stats[type].count);
}

app.get('/', function(req, res) {
  res.redirect('/info/');
});

app.post('/',
  passport.authenticate('auth', { session: false }),
  function(req, res) {
    var handler = lambda.handler;
    var context = new Context(name, timeout, req)
      .on('success', function(body) {
        try {
          if (body) {
            res.status(200);
            res.json(body);
          } else {
            res.status(204);
          }
          res.end();
          report(context, 'success');
        } catch (error) {
          res.status(500).end();
          report(context, 'fail');
        }
      })
      .on('fail', function(err) {
        if (err.status) {
          res.status(err.status);
        }
        res.json(err);
        res.end();
        report(context, 'fail');
      })
      .on('cancel', function() {
        res.setHeader('X-LAMBDA-STATUS', 'canceled');
        res.status(204).end();
        report(context, 'cancel');
      });
    if (typeof handler !== 'function') {
      context.fail({
        status:500,
        message:'Lambda function not properly configured'
      });
    } else {
      var ci = setImmediate(function() {
        try {
          res.setHeader('X-LAMBDA', name);
          handler.call(context, req.body, context);
        } catch (err) {
          throw err;
          context.fail({status:400, message:'Bad Request'});
        }
      });
      setTimeout(function() {
        clearTimeout(ci);
        if (!context.complete)
          context.cancel();
      }, timeout);
      req.on('close', function() {
        clearTimeout(ci);
        if(!context.complete)
          context.cancel();
      });
    }
});

app.options('/', function(req, res) {

});

app.get(
  '/info',
  passport.authenticate('auth', { session: false }),
  function(req, res) {
  res.status(200).json(stats);
});

app.listen(port); // use configurable port
console.log(util.format('Lambda function %s running on port %d', name, port));
