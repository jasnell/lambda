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
