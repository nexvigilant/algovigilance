/**
 * Mathematical computation kernels for Observatory Math Explorer.
 *
 * Ported from:
 * - stem-complex (Rust) — Complex arithmetic, Lanczos Gamma
 * - stem-number-theory (Rust) — Arithmetic functions, summatory
 * - nexcore-measure (Rust) — Shannon entropy
 *
 * All client-side computation. Zero server dependencies.
 */

// ─── Complex Arithmetic ────────────────────────────────────────────────────
// Ported from stem-complex/src/functions.rs + gamma.rs

export function cAbs(re: number, im: number): number {
  return Math.sqrt(re * re + im * im)
}

export function cExp(re: number, im: number): [number, number] {
  const eRe = Math.exp(re)
  return [eRe * Math.cos(im), eRe * Math.sin(im)]
}

export function cLn(re: number, im: number): [number, number] {
  return [Math.log(cAbs(re, im)), Math.atan2(im, re)]
}

export function cMul(aRe: number, aIm: number, bRe: number, bIm: number): [number, number] {
  return [aRe * bRe - aIm * bIm, aRe * bIm + aIm * bRe]
}

export function cDiv(aRe: number, aIm: number, bRe: number, bIm: number): [number, number] {
  const d = bRe * bRe + bIm * bIm
  if (d < 1e-300) return [0, 0]
  return [(aRe * bRe + aIm * bIm) / d, (aIm * bRe - aRe * bIm) / d]
}

/** Complex sine: sin(z) = (exp(iz) - exp(-iz)) / 2i */
export function cSin(re: number, im: number): [number, number] {
  const [eRe, eIm] = cExp(-im, re)
  const [fRe, fIm] = cExp(im, -re)
  return [(eIm - fIm) / 2, -(eRe - fRe) / 2]
}

/** Complex hyperbolic cosine: cosh(z) = (exp(z) + exp(-z)) / 2 */
export function cCosh(re: number, im: number): [number, number] {
  const [eRe, eIm] = cExp(re, im)
  const [fRe, fIm] = cExp(-re, -im)
  return [(eRe + fRe) / 2, (eIm + fIm) / 2]
}

// ─── Lanczos Gamma (g=7) ───────────────────────────────────────────────────
// Ported from stem-complex/src/gamma.rs — 9 Lanczos coefficients

const SQRT_2PI = Math.sqrt(2 * Math.PI)
const LANCZOS_G = 7.0
const LANCZOS_P0 = 0.9999999999998099
const LANCZOS_PAIRS: ReadonlyArray<[number, number]> = [
  [1, 676.5203681218851],
  [2, -1259.1392167224028],
  [3, 771.3234287776531],
  [4, -176.6150291621406],
  [5, 12.507343278686905],
  [6, -0.13857109526572012],
  [7, 9.984369578019572e-6],
  [8, 1.5056327351493116e-7],
]

/** Complex Gamma function with Lanczos approximation + reflection formula. */
export function cGamma(re: number, im: number): [number, number] {
  // Pole guard: non-positive integers
  if (Math.abs(im) < 1e-10 && re <= 0 && Math.abs(re - Math.round(re)) < 1e-10) {
    return [1e4, 0]
  }

  if (re < 0.5) {
    // Reflection: Gamma(z) = pi / (sin(pi*z) * Gamma(1-z))
    const [sinRe, sinIm] = cSin(Math.PI * re, Math.PI * im)
    const [gRe, gIm] = cGamma(1 - re, -im)
    const [denomRe, denomIm] = cMul(sinRe, sinIm, gRe, gIm)
    return cDiv(Math.PI, 0, denomRe, denomIm)
  }

  // Lanczos core for Re(z) >= 0.5
  const zpRe = re - 1
  const zpIm = im
  let agRe = LANCZOS_P0
  let agIm = 0
  for (const [k, pk] of LANCZOS_PAIRS) {
    const [dRe, dIm] = cDiv(pk, 0, zpRe + k, zpIm)
    agRe += dRe
    agIm += dIm
  }

  const tRe = zpRe + LANCZOS_G + 0.5
  const tIm = zpIm
  const [lnTRe, lnTIm] = cLn(tRe, tIm)
  const [mulRe, mulIm] = cMul(zpRe + 0.5, zpIm, lnTRe, lnTIm)
  const [tPowRe, tPowIm] = cExp(mulRe, mulIm)
  const [eNtRe, eNtIm] = cExp(-tRe, -tIm)

  let [rRe, rIm] = cMul(tPowRe, tPowIm, eNtRe, eNtIm)
  ;[rRe, rIm] = cMul(rRe, rIm, agRe, agIm)
  return [rRe * SQRT_2PI, rIm * SQRT_2PI]
}

// ─── Number Theory ──────────────────────────────────────────────────────────
// Ported from stem-number-theory/src/arithmetic.rs + summatory.rs

/** Trial division factorization. Returns array of [prime, exponent] pairs. */
export function factorize(n: number): Array<[number, number]> {
  if (n <= 1) return []
  const factors: Array<[number, number]> = []
  let num = Math.floor(n)
  for (let d = 2; d * d <= num; d++) {
    if (num % d === 0) {
      let exp = 0
      while (num % d === 0) { exp++; num = Math.floor(num / d) }
      factors.push([d, exp])
    }
  }
  if (num > 1) factors.push([num, 1])
  return factors
}

/** Euler totient phi(n) = n * prod(1 - 1/p) for prime p | n. */
export function eulerTotient(n: number): number {
  if (n <= 0) return 0
  if (n === 1) return 1
  const factors = factorize(n)
  let result = n
  for (const [p] of factors) {
    result = Math.floor(result / p) * (p - 1)
  }
  return result
}

/** Divisor sigma: sigma_k(n) = sum of k-th powers of divisors. */
export function divisorSigma(n: number, k: number): number {
  if (n <= 0) return 0
  const factors = factorize(n)
  if (factors.length === 0) return 1
  let result = 1
  for (const [p, exp] of factors) {
    let term = 0
    let pk = 1
    for (let i = 0; i <= exp; i++) {
      term += pk
      pk *= Math.pow(p, k)
    }
    result *= term
  }
  return result
}

/** Mobius function mu(n): (-1)^k for k distinct primes, 0 if squared factor. */
export function mobiusMu(n: number): number {
  if (n <= 0) return 0
  if (n === 1) return 1
  const factors = factorize(n)
  for (const [, exp] of factors) {
    if (exp > 1) return 0
  }
  return factors.length % 2 === 0 ? 1 : -1
}

/** Mertens function M(n) = sum_{k=1}^{n} mu(k). */
export function mertensFunction(n: number): number {
  let sum = 0
  for (let k = 1; k <= n; k++) sum += mobiusMu(k)
  return sum
}

// ─── Information Theory ─────────────────────────────────────────────────────
// Ported from nexcore-measure/src/entropy.rs

/** Shannon entropy H = -sum p_i * log2(p_i) from raw counts. */
export function shannonEntropy(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) return 0
  let h = 0
  for (const c of counts) {
    if (c > 0) {
      const p = c / total
      h -= p * Math.log2(p)
    }
  }
  return h
}

/** Sigmoid function sigma(x) = 1 / (1 + e^-x). */
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

/** Binary KL divergence: D_KL(p || q) for Bernoulli distributions. */
export function binaryKL(p: number, q: number): number {
  const eps = 1e-10
  p = Math.max(eps, Math.min(1 - eps, p))
  q = Math.max(eps, Math.min(1 - eps, q))
  return p * Math.log2(p / q) + (1 - p) * Math.log2((1 - p) / (1 - q))
}
