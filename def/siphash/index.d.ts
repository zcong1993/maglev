declare module siphash {
  function hash_uint(key: Uint32Array, m: Uint8Array | string): number
}

export = siphash
