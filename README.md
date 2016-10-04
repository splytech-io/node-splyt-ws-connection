# Splyt WebSocket Connection handler

Splyt WebSocket protocol implementation and connection handler.

## Example

```js
const SplytWSConnection = require('@splytech-io/splyt-ws-connection');

const connection = new SplytWSConnection('wss://wsapi.sandbox.splytech.io');

connection.on('connect', (url) => {
  console.log(`Connection established with ${url}`);
  
  connection.request('partner.sign-in', {
    login: 'username',
    password: 'password',
  }).catch((e) => console.error(e));
});

connection.on('disconnect', () => {
  console.log(`Connection closed`);
});

connection.on('push', (method, data) => {
  //handle push messages
});

connection.on('request', (method, data, cb) => {
  //handler request messages
  if (method === 'partner.new-trip-request') {
    cb(null, {}); //send response
  }
});

```

## SplytConnection Class API

### events
Can be defined using event listener.

```js
connection.on('event-name', (/* event args */) => {
});
```
#### connnect (url: String)

```js
connection.on('connect', (url) => {
  console.log(`Connection established with ${url}`);
});
```
#### disconnect ()

```js
connection.on('disconnect', () => {
  console.log(`Connection closed`);
});
```
#### push (method: String, data: Object)

```js
connection.on('push', (method, data) => {
  //handle push message
});
```

#### request (method: String, data: Object, cb: Function(err, result));

```js
connection.on('request', (method, data, cb) => {
  //handler request messages
  if (method === 'partner.new-trip-request') {
    cb(null, {}); //send response
  }
});
```