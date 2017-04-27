# Splyt WebSocket Connection handler

[![Known Vulnerabilities](https://snyk.io/test/npm/@splytech-io/splyt-ws-connection/badge.svg)](https://snyk.io/test/npm/@splytech-io/splyt-ws-connection)

Splyt WebSocket protocol implementation and connection handler.

## Example

```js
const SplytWSConnection = require('@splytech-io/splyt-ws-connection');

const connection = new SplytWSConnection('wss://wsapi.sandbox.splytech.io');

//gets emitted whenever connection with Splyt backend is established
connection.on('connect', (url) => {
  console.log(`Connection established with ${url}`);
  
  //send sign-in request to the Splyt server 
  //right after connection is established
  connection
    .request('partner.sign-in', {
      login: 'username',
      password: 'password',
    })
    .catch((e) => console.error(e));
});

connection.on('disconnect', () => {
  console.log(`Connection closed`);
});

//emitted when Splyt sends a push message
connection.on('push', (method, data) => {
  //handle push messages
});

//emitted when Splyt sends a request message
connection.on('request', (method, data) => {
  //handle request messages
  
  if (method === 'partner.new-trip-request') {
    return Promise.resolve({});
  }
  
  return Promise.reject();
});

```

## SplytWSConnection Class API

### events
Can be defined using co-event-listener.

```js
connection.on('event-name', /* Promise|GeneratorFunction|ThunkifiedFunction */);
```
#### connect(url: String)
Emitted when WebSocket connection is established.

```js
//ie using generator function
connection.on('connect', function *(url) {
  console.log(`Connection established with ${url}`);
});
```
#### disconnect()
Emitted when WebSocket connection drops.

```js
connection.on('disconnect', () => {
  console.log(`Connection closed`);
});
```
#### push(method: String, data: Object)
This event is emitted when Splyt server sends `push` message which does not require a response.

```js
//ie using resolved promise
connection.on('push', (method, data) => {
  //handle push message

  return Promise.resolve();
});
```

#### request(method: String, data: Object): Object;
This event is emitted when Splyt server sends `request` message.
The resolved values (or returned values in GeneratorFunctions) are sent back to the Splyt. Rejected (or thrown Exceptions) are converted automatically to failed response messages.

```js
//ie using native ES6 Promise
connection.on('request', (method, data) => new Promise((resolve, reject) => {
  //handler request messages

  if (method === 'partner.new-trip-request') {
    resolve({}); //send response

    return;
  }

  reject('unsupported method called');
}));
```
