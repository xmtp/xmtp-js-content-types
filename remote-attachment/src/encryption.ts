// crypto should provide access to standard Web Crypto API
// in both the browser environment and node.
export const crypto: Crypto =
  typeof window !== 'undefined'
    ? window.crypto
    : // eslint-disable-next-line @typescript-eslint/no-var-requires
    (require('crypto').webcrypto as unknown as Crypto)
