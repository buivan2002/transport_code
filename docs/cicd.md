# CI/CD Deployment

## Environment Split

Development:

```txt
Frontend: http://localhost:4000
Backend:  http://localhost:4002
```

Production:

```txt
Frontend: https://transport.qanh.site
Backend:  https://api-transport.qanh.site
```

## Production Network

Nginx runs in Docker on external network `proxy-network`.

Transport containers also join `proxy-network`, so Nginx proxies by container name:

```txt
transport.qanh.site
  -> nginx-proxy
  -> http://transport-express-frontend:3000

api-transport.qanh.site
  -> nginx-proxy
  -> http://transport-express-backend:4002
```

Transport containers do not publish app ports to the VPS host. They use `expose` only.

## Required VPS Network

```bash
docker network create proxy-network
```

Skip this if it already exists.

## GitHub Environment

The workflow uses:

```yml
environment: product
```

Create it here:

```txt
GitHub repo -> Settings -> Environments -> product
```

## Product Secrets

```txt
VPS_HOST=your.vps.ip.or.domain
VPS_USER=root
VPS_PASSWORD=your-vps-ssh-password
GHCR_USERNAME=your-github-username
GHCR_TOKEN=github personal access token with read:packages
GHTK_API_TOKEN=replace_me
```

## Product Variables

```txt
NEXT_PUBLIC_API_BASE_URL=https://api-transport.qanh.site
VPS_SSH_PORT=22
VPS_APP_DIR=/opt/transport-express
FRONTEND_ORIGIN=https://transport.qanh.site
CARRIER_API_TIMEOUT_MS=5000
GHTK_ENABLED=true
GHTK_MOCK_MODE=true
GHTK_API_BASE_URL=https://partner-api.example.com/ghtk
```

## Local Env Files

Backend local:

```env
PORT=4002
FRONTEND_ORIGIN=http://localhost:4000
```

Frontend local:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4002
```

## Deploy Rule

- Change under `apps/frontend/**`: build/deploy frontend only.
- Change under `apps/backend/**`: build/deploy backend only.
- Change outside `apps/**`: build/deploy both.
- Force push fallback: if diff base is unclear, build/deploy both.
