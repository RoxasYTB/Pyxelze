/// <reference types="node" />
/// <reference types="node" />
import { DecodeOptions, DecodeResult } from './types.js';
export declare function decodePngToBinary(input: Buffer | string, opts?: DecodeOptions): Promise<DecodeResult>;
