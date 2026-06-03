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

Nginx terminates SSL and proxies to local Docker-published ports:

```txt
transport.qanh.site
  -> Nginx :443
  -> 127.0.0.1:4001
  -> frontend container :3000

api-transport.qanh.site
  -> Nginx :443
  -> 127.0.0.1:4002
  -> backend container :4002
```

Docker ports are bound to `127.0.0.1`, so they are not directly reachable from the public internet by `VPS_IP:4001` or `VPS_IP:4002`.

Backend outbound internet remains open through Docker's default networking, so it can call carrier APIs.

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

Add these in Environment `product` -> Secrets:

```txt
VPS_HOST=your.vps.ip.or.domain
VPS_USER=root
VPS_PASSWORD=your-vps-ssh-password
GHCR_USERNAME=your-github-username
GHCR_TOKEN=github personal access token with read:packages
GHTK_API_TOKEN=replace_me
```

`VPS_HOST`, `VPS_USER`, `VPS_PASSWORD`, and `GHCR_USERNAME` may also be Environment variables, but secrets are safer.

## Product Variables

Add these in Environment `product` -> Variables:

```txt
NEXT_PUBLIC_API_BASE_URL=https://api-transport.qanh.site
VPS_SSH_PORT=22
VPS_APP_DIR=/opt/transport-express
FRONTEND_PORT=4001
BACKEND_PORT=4002
FRONTEND_ORIGIN=https://transport.qanh.site
CARRIER_API_TIMEOUT_MS=5000
GHTK_ENABLED=true
GHTK_MOCK_MODE=true
GHTK_API_BASE_URL=https://partner-api.example.com/ghtk
```

## Local Env Files

Backend local:

```txt
apps/backend/.env
```

```env
PORT=4002
FRONTEND_ORIGIN=http://localhost:4000
```

Frontend local:

```txt
apps/frontend/.env
```

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4002
```

## Nginx Example

```nginx
server {
    listen 80;
    server_name transport.qanh.site api-transport.qanh.site;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name transport.qanh.site;

    ssl_certificate /etc/letsencrypt/live/transport.qanh.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/transport.qanh.site/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 443 ssl http2;
    server_name api-transport.qanh.site;

    ssl_certificate /etc/letsencrypt/live/api-transport.qanh.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-transport.qanh.site/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Deploy Rule

- Change under `apps/frontend/**`: build/deploy frontend only.
- Change under `apps/backend/**`: build/deploy backend only.
- Change outside `apps/**`: build/deploy both.
- Force push fallback: if diff base is unclear, build/deploy both.
