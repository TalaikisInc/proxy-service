# Proxy Service with Proxy Rotation and Testing

Work in progress.

## TODO

* api -> keep proxies in memory, renew after ot renews
* api -> multi urls input
* api -> log results for each proxy
* api -> prefer best proxies
* bot -> remaining issues

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
