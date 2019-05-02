# Proxy Service with Proxy Rotation and Testing

## Features

* Send the url to this API which will query resource through proxy
* If proxy fails, next one is used
* Only successful response is sent back
* Generates throusands proxies and test them for usability

## TODO

* test the rotation in larger scale production environment
* fix proxy speed check
* api -> multi urls input
* api -> log speed/ latency results for each proxy
* api -> prefer best proxies
* api -> async batching for requests

## Install

```bash
npm i
```

## Run

```bash
npm run start
```

## Deploy (Docker)

```bash
./slave_build.sh <name>
./slave_start.sh <name> <port>
```

## Licence

GPL v3.0
