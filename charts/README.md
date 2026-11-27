# verana-search Helm chart

Deploys [verana-search](https://github.com/verana-labs/verana-search), the web interface for searching the Verana trust graph.

Published as an OCI chart on Docker Hub by the release workflows, alongside the `veranalabs/verana-search` image (same tag scheme as verana-frontend: `vX.Y.Z-dev.N` pre-releases from `main`, `vX.Y.Z` stable via release-please).

## Install

From the OCI registry:

```bash
helm install verana-search oci://docker.io/veranalabs/verana-search-chart --version <tag>
```

From a checkout:

```bash
helm install verana-search ./charts \
  --set global.domain=devnet.verana.network \
  --set env.GRAPH_BASE_URL=https://graph.devnet.verana.network \
  --set env.RESOLVER_BASE_URL=https://idx.devnet.verana.network \
  --set env.NETWORK_LABEL=Devnet
```

## Values

| Key | Default | Description |
|---|---|---|
| `global.domain` | `devnet.verana.network` | Base domain; ingress host is `{host}.{global.domain}` |
| `host` | `search` | Ingress host prefix |
| `image.repository` / `image.tag` | `veranalabs/verana-search` / chart version | Container image |
| `env.GRAPH_BASE_URL` | devnet graph | Verana Graph base URL |
| `env.RESOLVER_BASE_URL` | devnet indexer | Verana Indexer base URL |
| `env.NETWORK_LABEL` | `Devnet` | Network name shown in the header |
| `resources` | 50m/128Mi requests, 250m/256Mi limits | Minimal defaults |
| `ingress.enabled` | `true` | Publish the public route |
| `ingress.type` | `ingress` | `ingress` for nginx + cert-manager (letsencrypt-prod), `gateway` for an HTTPRoute |
| `ingress.gateway.name` | `""` | Gateway that accepts the route (type `gateway`) |
| `ingress.gateway.namespace` | `""` | Namespace of the Gateway, when it is another one |
| `ingress.gateway.sectionName` | `""` | HTTPS listener of the Gateway; empty attaches the route to every one |

Leave `ingress.gateway.sectionName` empty only when the Gateway has a single HTTPS listener: a `parentRef` without it attaches the route to every listener, so a plain HTTP one would serve the app with no redirect.
