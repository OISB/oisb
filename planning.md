# Planning

Planning for RTO

## C2S

## S2C

## Classes

- WS
- Conn
- Actor
- Cast
- Container
- LogInstance
- Lumberjack

## Logging

- Global `Log` object

## Startup

1. `main.js` is run
2. `main.js` imports `log.js`, and inits a `Log`
3. `main.js` imports `ws.js`, and inits a `WS`
4. `main.js` imports `docker.js`

## Conn

1. `WS` receives `WebSocket`
2. `Conn` is created with `WebSocket`
3. `Actor` is created with `Conn`
4. An `actor` event is fired

## Logging format

    ws: conn (id): on data: [info]

## WS: Roles

- `WS`: Manages `WebSocketServer`, inits `Conn`s
- `Conn`: Validates and parses JSON, handles errors and closing, handles pinging (upon being ordered to `ping`)
- `Actor`: Takes either an API or WS, and acts as a common and stateful interface, handles pinging (upon being ordered to `ping`)
- `Cast`: Tracks all actors, assigns IDs, pings actors

## Future

- `options.js`: Manage options, like `MAX_PING`, `PORT`, `WS_START_TIMING`

## Options

- `ws_port`: What port to run the WS on (not just called `port` b/c of an API in the future)
- `max_payload`: WS max payload

## C2S Actions

- `initial`: Initial
  - `actor`: `null` or an ID
- `pong`: Pong
  - Data is a copy of `ping` data
- `run`: Run
  - Data is inputJSON
- `stop`: Stops running
  - No data

## S2C Actions

- `initial`: Initial
  - `actor`: Actor ID
- `ping`: Ping
  - `data`: Any data, typically `now`
- `output`: Output from container
  - Data is outputJSON
- `run`: Ticks running
  - Status
- `stop`: Ticks not running with no data
  - Status
- `finish`: Ticks not running with optional data (typically debug/status code, not output)
  - Status, `data.data` is `outputJSON`, or `null`

## Docker

- Class for a container
- Class for a container slot (one slot per actor)
- Class to manage containers
- Class to manage resources, maybe?

## Dependency Injection

- Via `.init()`

## Docking



## Summary

`cast.on("actor")`

## Logging

- main
- ws
- (conn)
- (actor)
- (cast)
- (dock)
- (docking)
- json