declare module 'gifenc' {
  export interface GIFEncoderInstance {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: {
        palette?: Uint8Array
        delay?: number
        repeat?: number
        transparent?: boolean
        transparentIndex?: number
        dispose?: number
      },
    ): void
    finish(): void
    bytes(): Uint8Array
    bytesView(): Uint8Array
    reset(): void
  }

  export function GIFEncoder(opts?: { initialCapacity?: number; auto?: boolean }): GIFEncoderInstance
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    opts?: { colorSpace?: string; oneBitAlpha?: boolean | number },
  ): Uint8Array
  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: Uint8Array,
    colorSpace?: string,
  ): Uint8Array

  export default GIFEncoder
}
