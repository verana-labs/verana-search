/**
 * DIDComm connection QR of a Verifiable Service, per [SRCH-RES-4] of spec.md.
 *
 * The QR carries the bare DID: the wallet resolves the DID Document and picks
 * the DIDComm version both sides support (v2 when it can, v1 otherwise), so no
 * invitation needs to be built here.
 */

/** True when the DID Document declares a DIDComm endpoint (DIDCOMM badge of [SRCH-RES-1]). */
export function hasDidcommEndpoint(endpointTypes: string[]): boolean {
  return endpointTypes.some((t) => ['didcommmessaging', 'did-communication'].includes(t.toLowerCase()))
}
