# Midnight Escrow Contract

This project demonstrates a privacy-preserving Escrow contract on the Midnight Network. It allows a buyer to deposit funds which are held until a seller provides a secret release key, or until the buyer reclaims the funds if the terms are not met.

## Contract Details

- **Network:** Midnight Preprod
- **Contract Address:** `6b16e800422ef51c36bdad1c623d5ddb794cc3822e456af2fa33af1bf7a96ec1`
- **Contract Type:** Escrow

## Project Structure

- **`contract/`**: Contains the Compact smart contract source code and witness definitions.
  - `src/escrow.compact`: The Escrow smart contract logic written in Compact.
  - `src/witnesses.ts`: TypeScript witness definitions for private state access (secret keys, nonces).
- **`counter-cli/`**: A command-line interface (CLI) to interact with the deployed contract.
  - `src/api.ts`: Core API for wallet management, contract deployment, and interaction.
  - `src/cli.ts`: The interactive CLI menu system.

## Features

1.  **Create Escrow**: A buyer funds the contract with a specified amount and sets a hash of the release secret.
2.  **Accept Escrow**: A seller (designated by their public key) accepts the terms.
3.  **Release Funds**: The seller reveals the secret matching the hash to release the funds to themselves.
4.  **Refund**: The buyer can reclaim funds if the escrow allows (e.g., expiry or mutual agreement, though currently simplified).

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker (for running the local Proof Server)
- Midnight Wallet extension (optional, for browser interaction) or CLI wallet (built-in).

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the contract and CLI:
    ```bash
    cd contract && npm run build
    cd ../counter-cli && npm run build
    ```

### Running the CLI

To interact with the contract on the Preprod network:

1.  Start the Proof Server (in a separate terminal):
    ```bash
    cd counter-cli
    npm run preprod-ps
    ```
2.  Run the CLI:
    ```bash
    cd counter-cli
    npm run preprod
    ```

### Usage

1.  **Wallet Setup**: Create a new wallet or restore from a seed phrase.
    *   *Note: Ensure your wallet has `tNight` tokens from the [faucet](https://faucet.preprod.midnight.network/).*
2.  **Deploy**: Select "Deploy new escrow contract" to create a fresh instance.
3.  **Join**: Select "Join existing escrow contract" and valid contract address `6b16e800422ef51c36bdad1c623d5ddb794cc3822e456af2fa33af1bf7a96ec1`.

## Development

- **Modify Contract**: Edit `contract/src/escrow.compact`.
- **Update Witnesses**: If contract private state changes, update `contract/src/witnesses.ts`.
- **Rebuild**: run `npm run build` in both directories after changes.

## License

Apache-2.0
