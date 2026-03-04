# Midnight Escrow Contract

This project demonstrates a privacy-preserving Escrow contract on the Midnight Network. It enables a Buyer to deposit funds securely, which are released to a Seller only when specific conditions are met (providing a secret).

## Features

*   **Stable Identity**: Uses a persistent, deterministic identity system (`escrow-identity.json`) separate from your Midnight wallet address.
*   **Privacy-Preserving**: Contract logic uses Zero-Knowledge Proofs (ZKPs) to verify the Seller's identity and the release secret without revealing them on the public ledger unnecessarily.
*   **Interactive CLI**: A full-featured command-line interface for Deploying, Joining, Funding, and Releasing escrows.

## Project Structure

*   **`contract/`**: Compact smart contract source code.
    *   `src/escrow.compact`: The Escrow logic.
*   **`counter-cli/`**: The client application.
    *   `src/api.ts`: API for Midnight interaction.
    *   `src/cli.ts`: Interactive menu.

## Getting Started

### Prerequisites

*   Node.js (v18+)
*   Docker (for the local Proof Server)
*   Network: Midnight Preprod

**⚠️ IMPORTANT:** The CLI uses a local LevelDB database for your private state. To support switching between Alice and Bob on the same machine, the code has been updated to use unique database sessions for every run. However, please **Only run ONE CLI instance at a time**.

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3. Compile the contract:
    ```bash
    cd contract && npm run compact
    ``` 
4.  Build the project:
    ```bash
    cd contract && npm run build
    cd ../counter-cli && npm run build
    ```

### Running the CLI (Recommended Workflow)

To simulate Alice and Bob efficiently, run the Proof Server separately so it stays alive while you switch CLI sessions.

1.  **Start the Proof Server** (Terminal 1):
    ```bash
    cd counter-cli
    docker compose -f proof-server.yml up
    ```
    *Wait until you see "Actix runtime found; starting in Actix runtime". Keep this terminal open.*

2.  **Run the Escrow CLI** (Terminal 2):
    ```bash
    cd counter-cli
    npm run preprod
    ```
    *This starts the interactive menu.*

## 🧪 Test Data for Alice & Bob Protocol

Use these seeds to simulate the two parties.

### 👩 Alice (Seller / Deployer)
*   **Seed Phrase**: `57bb166cb6bbf3a6cb5e93a26043e3e2d3c830b63b85286fe97619456a2a23f2`
*   **Role**: Deploys the contract, Provides Identity, Claims Funds.

### 👨 Bob (Buyer / Creator)
*   **Seed Phrase**: `2b477c42d95b5eb49222b25f9e5267c44cb15bef9646f086248bff24f43e727f`
*   **Role**: Funds the escrow, Sets the conditions.
*   **Test Release Secret**: `4f8c2a9d7b1e3c5a8d6f2e9a1c4b7d8e5f3a9c2d6b1e4f8a7c9d2e5b6a1f3c4a`
*   **Test Contract Address**: `715a495d864a7e5eb90ae5506a554c9611dc8fe820d93430362b226978b3466c`
*   **Test Escrow Public Key**: `21bb9c3bd544a09743e0b0e345a42e582c627b73fc36588761ca745f4254a0d4`

> **Note**: The following values are examples from a successful run. When you run Phase 2 (Bob), the CLI will generate a **new, unique Nonce** for you.
>
> *   **Example Nonce**: `850028d7962d977c6f9c1e6b5106c5ef0be359eb59ea890c02a9fb073febe9fa`
> *   **Example Secret**: `4f8c2a9d7b1e3c5a8d6f2e9a1c4b7d8e5f3a9c2d6b1e4f8a7c9d2e5b6a1f3c4a`


## Usage Flow (Step-by-Step)

This demo simulates a transaction between Alice and Bob. Follow these steps sequentially in **Terminal 2**.

### Phase 1: Setup (Alice)
1.  **Start CLI**: `npm run preprod`.
2.  **Wallet**: Restore using **Alice's Seed**.
3.  **[1] Deploy new escrow contract**: The CLI will deploy a fresh contract.
    *   **Copy the Contract Address**.
4.  **[6] Show My Escrow Identity**:
    *   **Copy your Escrow Public Key**.
5.  **Exit** the CLI (Option [7] or Ctrl+C).

### Phase 2: Funding (Bob)
1.  **Start CLI**: `npm run preprod`.
2.  **Wallet**: Restore using **Bob's Seed**.
3.  **[2] Join existing escrow contract**: Paste the Contract Address (from Phase 1).
4.  **[1] Create Escrow (Buyer)**:
    *   **Seller Public Key**: Paste **Alice's Escrow Public Key** (from Phase 1).
    *   **Amount**: Enter `100` (or any amount).
    *   **Release Secret**: Paste the **Test Release Secret**.
5.  **Action**: The CLI will print a **NONCE** (automatically generated) and confirm the Secret.
    *   **COPY BOTH THE NONCE AND SECRET.** You must share them with Alice.
6.  **Exit** the CLI.

### Phase 3: Release (Alice)
1.  **Start CLI**: `npm run preprod`.
2.  **Wallet**: Restore using **Alice's Seed**.
3.  **[2] Join existing escrow contract**: Paste the Contract Address.
4.  **[2] Accept Escrow (Seller)**: Confirms you are the designated seller.
5.  **[3] Release Funds (Seller)**:
    *   **Prompt**: Enter the **Amount**, **Secret**, and **Nonce** provided by Bob.
6.  **Success!**: The funds are released to Alice's wallet.

## Troubleshooting

*   **`Failed to join contract`**: Ensure you have exited the previous CLI session completely. The updated code creates a new private state session for each run to avoid conflicts.
*   **`Only seller can accept`**: Bob probably funded the contract using Alice's *Wallet Address* instead of her *Escrow Identity Key*. Ensure Option 6 key is used.
*   **Refunding**: If Bob made a mistake (e.g., failed to copy the Nonce), log in as Bob and use **[4] Refund** to reclaim funds.

## License

Apache-2.0
