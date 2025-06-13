import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WitnessContext } from '@midnight-ntwrk/compact-runtime';

// Get __dirname in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the only folder inside ./managed
const managedPath = path.join(__dirname, 'managed');
const [folder] = fs.readdirSync(managedPath).filter(f =>
  fs.statSync(path.join(managedPath, f)).isDirectory()
);

// Dynamically import the contract
const { Ledger } = await import(`./managed/${folder}/contract/index.cjs`);


export type CounterPrivateState = {
  readonly privateCounter: number; 
};

export const createUnounterPrivateState = (privateCounter: number) => ({
  privateCounter,
});


export type BBoardPrivateState = {
  // EXERCISE 1a: FILL IN A REPRESENTATION OF THE PRIVATE STATE
  readonly secretKey: Uint8Array; // EXERCISE ANSWER
};

export const createBBoardPrivateState = (secretKey: Uint8Array) => ({
  // EXERCISE 1b: INITIALIZE THE OBJECT OF TYPE BBoardPrivateState
  secretKey, // EXERCISE ANSWER
});

/* **********************************************************************
 * The witnesses object for the bulletin board contract is an object
 * with a field for each witness function, mapping the name of the function
 * to its implementation.
 *
 * The implementation of each function always takes as its first argument
 * a value of type WitnessContext<L, PS>, where L is the ledger object type
 * that corresponds to the ledger declaration in the Compact code, and PS
 *  is the private state type, like BBoardPrivateState defined above.
 *
 * A WitnessContext has three
 * fields:
 *  - ledger: T
 *  - privateState: PS
 *  - contractAddress: string
 *
 * The other arguments (after the first) to each witness function
 * correspond to the ones declared in Compact for the witness function.
 * The function's return value is a tuple of the new private state and
 * the declared return value.  In this case, that's a BBoardPrivateState
 * and a Uint8Array (because the contract declared a return value of Bytes[32],
 * and that's a Uint8Array in TypeScript).
 *
 * The local_secret_key witness does not need the ledger or contractAddress
 * from the WitnessContext, so it uses the parameter notation that puts
 * only the binding for the privateState in scope.
 */
export const witnesses = {
  local_secret_key: ({ privateState }: WitnessContext<typeof Ledger, BBoardPrivateState>): [BBoardPrivateState, Uint8Array] => [
    // EXERCISE 2: WHAT ARE THE CORRECT TWO VALUES TO RETURN HERE?
    privateState, // EXERCISE ANSWER
    privateState.secretKey, // EXERCISE ANSWER
  ],
};