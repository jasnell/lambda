'use strict';

var util = require('util');
var uuid = require('node-uuid');
var EventEmitter = require('events').EventEmitter;

var _req = Symbol('req');
var _timeout = Symbol('timeout');

function constant(target, name, value) {
  Object.defineProperty(target, name, {
    configurable: false,
    enumerable: true,
    value: value
  });
}

function Context(name, timeout, req) {
  if (!(this instanceof Context))
    return new Context(name, timeout, req);
  EventEmitter.call(this);
  this[_req] = req;
  this[_timeout] = timeout;
  constant(this, 'start', process.hrtime());
  constant(this, 'id', uuid.v4());
  constant(this, 'ts', new Date().valueOf());
  constant(this, 'ip', req.ip);
  constant(this, 'name', name);
  constant(this, 'lenient', req.prefer.handling == 'lenient');
}
util.inherits(Context,EventEmitter);

function succeed(body) {
  if (!this.complete) {
    constant(this, 'succeed', true);
    constant(this, 'complete', true);
    this.emit('success', body, this);
  }
}

function fail(err) {
  constant(this, 'failed', true);
  constant(this, 'complete', true);
  this.emit('fail', err);
}

function done(err, body) {
  if (err) {
    this.fail(err);
    return;
  }
  this.succeed(body);
}

function cancel() {
  constant(this, 'canceled', true);
  constant(this, 'complete', true);
  this.emit('cancel');
}

function getRemainingTimeInMillis() {
  var d = new Date();
  return (this.ts + this[_timeout]) - d.valueOf();
}

constant(Context.prototype, 'succeed', succeed);
constant(Context.prototype, 'fail', fail);
constant(Context.prototype, 'done', done);
constant(Context.prototype, 'cancel', cancel);
constant(
  Context.prototype,
  'getRemainingTimeInMillis',
  getRemainingTimeInMillis);

module.exports = Context;
