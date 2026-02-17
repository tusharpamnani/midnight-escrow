import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger } from './managed/escrow/contract/index.js';

export type EscrowPrivateState = {};

export const witnesses = {
  secretKey(context: WitnessContext<Ledger, EscrowPrivateState>): [EscrowPrivateState, Uint8Array] {
    return [context.privateState, new Uint8Array(32)];
  },

  releaseSecret(context: WitnessContext<Ledger, EscrowPrivateState>): [EscrowPrivateState, Uint8Array] {
    return [context.privateState, new Uint8Array(32)];
  },

  nonce(context: WitnessContext<Ledger, EscrowPrivateState>): [EscrowPrivateState, Uint8Array] {
    return [context.privateState, new Uint8Array(32)];
  },
};