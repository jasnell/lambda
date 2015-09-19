exports.handler = (input, context) => {
  setImmediate(()=>context.succeed({'a':'b'}));
};

