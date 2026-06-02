# CI/CD Deployment

## Runtime Ports

- Frontend container listens on `3000`.
- Frontend is exposed on VPS by `FRONTEND_PORT`, default `4000`.
- Backend container listens on `4002`.
- Backend is exposed on VPS by `BACKEND_PORT`, default `4002`.

Example public URLs:

```txt
Frontend: http://YOUR_VPS_IP:4000
Backend:  http://YOUR_VPS_IP:4002
```

## GitHub Actions Flow

Workflow file:

```txt
.github/workflows/deploy.yml
```

Deploy rule:

- Changed files under `apps/frontend/**`: build and deploy frontend only.
- Changed files under `apps/backend/**`: build and deploy backend only.
- Changed files outside `apps/**`: build and deploy both.

Images are pushed to GitHub Container Registry:

```txt
ghcr.io/<github-owner>/transport-express-frontend:latest
ghcr.io/<github-owner>/transport-express-backend:latest
```

## GitHub Secrets And Variables

Go to:

```txt
GitHub repo -> Settings -> Secrets and variables -> Actions
```

Use repository-level Secrets/Variables only. This workflow does not use GitHub Environments.

Required repository secrets:

```txt
VPS_HOST=your.vps.ip.or.domain
VPS_USER=root
VPS_PASSWORD=your-vps-ssh-password
GHCR_USERNAME=your-github-username
GHCR_TOKEN=github personal access token with read:packages
FRONTEND_PUBLIC_API_BASE_URL=http://your.vps.ip:4002
GHTK_API_TOKEN=replace_me
```

Required repository variables:

```txt
FRONTEND_ORIGIN=http://your.vps.ip:4000
```

Optional repository variables:

```txt
VPS_SSH_PORT=22
VPS_APP_DIR=/opt/transport-express
FRONTEND_PORT=4000
BACKEND_PORT=4002
CARRIER_API_TIMEOUT_MS=5000
GHTK_ENABLED=true
GHTK_MOCK_MODE=true
GHTK_API_BASE_URL=https://partner-api.example.com/ghtk
```

## GHCR Token

Create a GitHub Personal Access Token:

```txt
GitHub -> Settings -> Developer settings -> Personal access tokens
```

For the VPS to pull images from GHCR, the token needs:

```txt
read:packages
```

If your package is private, keep this token as `GHCR_TOKEN`.

The workflow itself pushes images with `GITHUB_TOKEN`, so `GHCR_TOKEN` is only for the VPS pull step.

## VPS Prerequisites

Install Docker and Docker Compose plugin on the VPS.

Check:

```bash
docker --version
docker compose version
```

Make sure the VPS firewall allows:

```txt
4000/tcp for frontend
4002/tcp for backend
```

The workflow creates these files on the VPS automatically:

```txt
/opt/transport-express/docker-compose.prod.yml
/opt/transport-express/.env
/opt/transport-express/backend.env
```

## Manual Deploy From VPS

After the first GitHub Actions deploy, you can manually restart:

```bash
cd /opt/transport-express
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```
