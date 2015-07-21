A simple example of implementing AWS lambda like functionality
with Node.js and Docker containers.

Build the lambda daemon image using:

```
cd daemon
docker build -t lambda .
```

Then, from a different location, you can create your own lambda functions,

lambda.js
```
exports.handler = function(input, context) {
  context.succeed({abc:123});
};
```

Dockerfile
```
FROM lambda
COPY lambda.js /usr/src/app/lambda/
EXPOSE 8080
```

```
docker builder -t lambda-example .
```

To run:

```
docker run -p=8080:8080 lambda-example
```

* Your lambda function will be running at `http://{dockerhost}:8080/`
* Your lambda function accepts JSON or url-encoded form input.
* Your lambda function can provide a Passport Authentication Strategy.
* You can do a HTTP GET to `http://{dockerhost}:8080/info` to view
  basic statistics.

## Program model

The `context` object has the following methods:

* `succeed(body)` - call to indicate that the function is complete and
  successful. The body will be passed to JSON.stringify and returned.
* `fail(error)` - call to indicate that the function has failed. The 
  error will be passed to JSON.stringify and returned. If the error 
  object has a `status` property, it will be set as the HTTP Response
  status code (e.g. `error.status = 400`)
* `cancel()` - call to indicate that the function has been aborted/canceled.
  An empty response will be returned
* `done(error,body)` - alternative to `succeed` and `fail` that uses the
  typical Node.js callback pattern.
* `getRemainingTimeInMillis()` - returns the approximate remaining time
  before the function times out. The default timeout is 10 seconds
  (which means the function will be automatically aborted if it does
  not return a result within 10 seconds). The default can be overriden
  using the `LAMBDA_TIMEOUT` environment variable.

The `context` object has the following properties:

* `id` - unique UUID for the request
* `ts` - Unix timestamp indicating when the request was receieved
* `ip` - The client IP address
* `name` - The name of the lambda function. The name can be set using 
  the `LAMBDA_NAME` environment variable
* `lenient` - `true` if the lambda function should be run in `lenient` 
  mode. Defaults to `false`. This is requested by the client using the
  HTTP Prefer header (`Prefer: handling=lenient`) in the request. 
  Lenient mode would indicate that the function should be more tolerant
  of possible failure conditions.

(note, these properties are different than what you see in Amazon's 
API. The intent here was to provide an example of similar functionality,
not to fully duplicate it)

Lambda functions must be written to be as ephemeral as possible, maintaining
no state of their own. Each invocation should be entirely self-contained.

Your lambda functions can require other modules but those need to be
installed using the Dockerfile. A future iteration of this demo may 
try to automate the installation process a bit more for lambda function
dependencies.
