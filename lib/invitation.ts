/**
 * DIDComm invitation to a Verifiable Service, per [SRCH-RES-4] of spec.md.
 *
 * A VS Agent accepts a DID Exchange request whose invitation id is its public
 * DID, so one static out-of-band invitation to the DID works for every user:
 * no call to the service is needed to build it.
 */

const OOB_TYPE = 'https://didcomm.org/out-of-band/1.1/invitation'
const DID_EXCHANGE = 'https://didcomm.org/didexchange/1.1'

/** True when the DID Document declares a DIDComm endpoint (DIDCOMM badge of [SRCH-RES-1]). */
export function hasDidcommEndpoint(endpointTypes: string[]): boolean {
  return endpointTypes.some((t) => ['didcommmessaging', 'did-communication'].includes(t.toLowerCase()))
}

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** `{invitationBaseUrl}?oob=<base64url out-of-band invitation to the DID>`. */
export function buildInvitationUrl(
  invitationBaseUrl: string,
  did: string,
  label: string | null,
  imageUrl: string | null
): string {
  const invitation: Record<string, unknown> = {
    '@type': OOB_TYPE,
    '@id': did,
    label: label ?? did,
    handshake_protocols: [DID_EXCHANGE],
    services: [did],
  }
  if (imageUrl) invitation.imageUrl = imageUrl
  return `${invitationBaseUrl}?oob=${base64UrlEncode(JSON.stringify(invitation))}`
}
