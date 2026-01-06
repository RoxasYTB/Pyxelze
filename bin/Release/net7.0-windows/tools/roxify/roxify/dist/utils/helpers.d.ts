/// <reference types="node" />
/// <reference types="node" />
export declare function colorsToBytes(colors: Array<{
    r: number;
    g: number;
    b: number;
}>): Buffer;
export declare function deltaEncode(data: Buffer): Buffer;
export declare function deltaDecode(data: Buffer): Buffer;
export declare function applyXor(buf: Buffer, passphrase: string): Buffer;
export declare function tryDecryptIfNeeded(buf: Buffer, passphrase?: string): Buffer;
