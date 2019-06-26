import * as siphash from 'siphash'

const HASH_KEY_1 = new Uint32Array([0xdeadbabe])
const HASH_KEY_2 = new Uint32Array([0xdeadbeef])

const isPrime = (num: number): boolean => {
  for (let i = 2, s = Math.sqrt(num); i <= s; i += 1) {
    if (num % i === 0) {
      return false
    }
  }
  return num > 1
}

class Maglev {
  private nodelists: string[] = []
  private n: number = 0
  private m: number = 0
  private permutation: number[][] = []
  private lookup: number[] = []

  constructor(backends: string[], m: number) {
    if (!isPrime(m)) {
      throw new Error('Lookup table size is not a prime number')
    }
    this.m = m

    this.setBackends(backends)
    console.log(this.permutation, this.lookup)
  }

  setBackends(backends: string[]) {
    if (backends.length > this.m) {
      throw new Error('Number of backends is greater than lookup table')
    }

    this.nodelists = [...backends]
    this.n = backends.length
    this.generatePopulation()
    this.populate()
  }

  addBackend(backend: string) {
    if (this.nodelists.includes(backend)) {
      throw new Error('Exist already')
    }

    if (this.m === this.n) {
      throw new Error('Number of backends would be greater than lookup table')
    }

    this.nodelists.push(backend)
    this.n = this.nodelists.length

    this.generatePopulation()
    this.populate()
  }

  removeBackend(backend: string) {
    const index = this.nodelists.findIndex(node => node === backend)
    if (index < 0) {
      throw new Error('Not found')
    }

    this.nodelists.splice(index, 1)
    this.n = this.nodelists.length

    this.generatePopulation()
    this.populate()
  }

  clear() {
    this.nodelists = []
    this.permutation = []
    this.lookup = []
    this.n = 0
    this.m = 0
  }

  get(key: string): string {
    if (this.nodelists.length === 0) {
      throw new Error('Empty')
    }

    const hashKey = this.hashKey(key)

    return this.nodelists[this.lookup[hashKey % this.m]]
  }

  private hashKey(key: string): number {
    return siphash.hash_uint(HASH_KEY_1, key)
  }

  private generatePopulation() {
    if (this.nodelists.length === 0) {
      return
    }

    this.nodelists.sort()

    this.nodelists.forEach(node => {
      const offset = siphash.hash_uint(HASH_KEY_1, node) % this.m
      const skip = (siphash.hash_uint(HASH_KEY_2, node) % (this.m - 1)) + 1
      const row = []
      for (let j = 0; j < this.m; j += 1) {
        row.push((offset + j * skip) % this.m)
      }
      this.permutation.push(row)
    })
  }

  private populate() {
    if (this.nodelists.length === 0) {
      return
    }

    let n = 0

    const entry = Array(this.m).fill(-1)
    const next = Array(this.n).fill(0)

    while (true) {
      for (let i = 0; i < this.n; i += 1) {
        let c = this.permutation[i][next[i]]
        while (entry[c] >= 0) {
          next[i] += 1
          c = this.permutation[i][next[i]]
        }

        entry[c] = i
        next[i] += 1
        n += 1

        if (n === this.m) {
          this.lookup = entry
          return
        }
      }
    }
  }
}

export default Maglev
