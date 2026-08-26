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

```bash
helm install verana-search ./helm/verana-search \
  --set env.graphBaseUrl=https://graph.devnet.verana.network \
  --set env.resolverBaseUrl=https://idx.devnet.verana.network \
  --set env.networkLabel=Devnet \
  --set ingress.enabled=true \
  --set ingress.host=search.devnet.verana.network
```

Default resources are intentionally minimal: requests `50m` CPU / `128Mi` memory, limits `250m` / `256Mi`.
