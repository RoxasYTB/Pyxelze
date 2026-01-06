/// <reference types="node" />
/// <reference types="node" />
/**
 * List files in a Rox PNG archive without decoding the full payload.
 * Returns the file list if available, otherwise null.
 * @param pngBuf - PNG data
 * @public
 */
export declare function listFilesInPng(pngBuf: Buffer, opts?: {
    includeSizes?: boolean;
}): Promise<string[] | {
    name: string;
    size: number;
}[] | null>;
/**
 * Detect if a PNG/ROX buffer contains an encrypted payload (requires passphrase)
 * Returns true if encryption flag indicates AES or XOR.
 */
export declare function hasPassphraseInPng(pngBuf: Buffer): Promise<boolean>;
