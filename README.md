# verana-search

Web interface for searching the Verana trust graph. See [spec.md](./spec.md) for the full specification.

A thin client over two public read APIs:

- **Verana Graph** faceted search: `POST {GRAPH_BASE_URL}/v4/graph/search`
- **Verana Indexer** Verifiable Trust Resolver (result enrichment): `POST {RESOLVER_BASE_URL}/v4/verifiable-trust/resolve`

Design system: verana.io-website "Protocol Grid" (same tokens, fonts, light/dark).

## Configuration

Runtime environment variables (never baked at build time; the same image serves any network):

| Variable | Default | Description |
|---|---|---|
| `GRAPH_BASE_URL` | `https://graph.devnet.verana.network` | Verana Graph base URL |
| `RESOLVER_BASE_URL` | `https://idx.devnet.verana.network` | Verana Indexer base URL |
| `NETWORK_LABEL` | `Devnet` | Network name shown in the header |

Health probe: `GET /api/health` (200 when up and configuration is valid).

## Development

```bash
npm install
npm run dev
# http://localhost:3000
```

## Docker

```bash
docker build -t veranalabs/verana-search .
docker run -p 3000:3000 \
  -e GRAPH_BASE_URL=https://graph.devnet.verana.network \
  -e RESOLVER_BASE_URL=https://idx.devnet.verana.network \
  -e NETWORK_LABEL=Devnet \
  veranalabs/verana-search
```

## Helm

The chart lives in [charts/](./charts/) (chart name `verana-search-chart`) and is published as an OCI chart on Docker Hub by the release workflows.

```bash
helm install verana-search ./charts \
  --set global.domain=devnet.verana.network \
  --set env.GRAPH_BASE_URL=https://graph.devnet.verana.network \
  --set env.RESOLVER_BASE_URL=https://idx.devnet.verana.network \
  --set env.NETWORK_LABEL=Devnet
```

The ingress host is `{host}.{global.domain}` (default `search.devnet.verana.network`). Default resources are intentionally minimal: requests `50m` CPU / `128Mi` memory, limits `250m` / `256Mi`. See [charts/README.md](./charts/README.md) for all values.

## Releases

Same pipeline as verana-frontend:

- **CI** (`ci.yml`): 2060-io organization linter (with charts lint) plus a `next build` check.
- **Dev pre-releases** (`dev-release.yml`): semantic-release on `main` publishes `vX.Y.Z-dev.N` GitHub pre-releases, the `veranalabs/verana-search` Docker image (`dev`, `vX-dev`, `vX.Y-dev`, `vX.Y.Z-dev.N`) and the Helm chart to `oci://docker.io/veranalabs`.
- **Stable releases** (`stable-release.yml`): release-please cuts `vX.Y.Z` releases, pushes `latest` + `vX.Y.Z` image tags and the chart, and announces on Discord.
