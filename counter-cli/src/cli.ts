import { type WalletContext } from './api';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface, type Interface } from 'node:readline/promises';
import { type Logger } from 'pino';
import { type StartedDockerComposeEnvironment, type DockerComposeEnvironment } from 'testcontainers';
import { type EscrowProviders, type DeployedEscrowContract } from './common-types';
import { type Config, StandaloneConfig } from './config';
import * as api from './api';

let logger: Logger;

const GENESIS_MINT_WALLET_SEED =
  '0000000000000000000000000000000000000000000000000000000000000001';

const BANNER = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              Midnight Private Escrow Demo                    ║
║              ───────────────────────────                     ║
║              Privacy-preserving escrow contract              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

const DIVIDER = '──────────────────────────────────────────────────────────────';

const WALLET_MENU = `
${DIVIDER}
  Wallet Setup
${DIVIDER}
  [1] Create a new wallet
  [2] Restore wallet from seed
  [3] Exit
${'─'.repeat(62)}
> `;

const contractMenu = (dustBalance: string) => `
${DIVIDER}
  Escrow Actions${dustBalance ? `                    DUST: ${dustBalance}` : ''}
${DIVIDER}
  [1] Deploy new escrow contract
  [2] Join existing escrow contract
  [3] Monitor DUST balance
  [4] Exit
${'─'.repeat(62)}
> `;

/* ─── Wallet Setup ───────────────────────────────────────── */

const buildWalletFromSeed = async (config: Config, rli: Interface): Promise<WalletContext> => {
  const seed = await rli.question('Enter your wallet seed: ');
  return await api.buildWalletAndWaitForFunds(config, seed);
};

const buildWallet = async (config: Config, rli: Interface): Promise<WalletContext | null> => {
  if (config instanceof StandaloneConfig) {
    return await api.buildWalletAndWaitForFunds(config, GENESIS_MINT_WALLET_SEED);
  }

  while (true) {
    const choice = await rli.question(WALLET_MENU);
    switch (choice.trim()) {
      case '1':
        return await api.buildFreshWallet(config);
      case '2':
        return await buildWalletFromSeed(config, rli);
      case '3':
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

/* ─── Contract Interaction ───────────────────────────────── */

const getDustLabel = async (wallet: api.WalletContext['wallet']): Promise<string> => {
  try {
    const dust = await api.getDustBalance(wallet);
    return dust.available.toLocaleString();
  } catch {
    return '';
  }
};

const joinContract = async (
  providers: EscrowProviders,
  rli: Interface,
): Promise<DeployedEscrowContract> => {
  const contractAddress = await rli.question('Enter the contract address (hex): ');
  return await api.joinContract(providers, contractAddress);
};

const startDustMonitor = async (wallet: api.WalletContext['wallet'], rli: Interface): Promise<void> => {
  console.log('');
  const stopPromise = rli.question('  Press Enter to return to menu...\n').then(() => {});
  await api.monitorDustBalance(wallet, stopPromise);
  console.log('');
};

const deployOrJoin = async (
  providers: EscrowProviders,
  walletCtx: api.WalletContext,
  rli: Interface,
): Promise<DeployedEscrowContract | null> => {
  while (true) {
    const dustLabel = await getDustLabel(walletCtx.wallet);
    const choice = await rli.question(contractMenu(dustLabel));

    switch (choice.trim()) {
      case '1':
        try {
          const contract = await api.withStatus('Deploying escrow contract', () =>
            api.deploy(providers),
          );
          console.log(`  Contract deployed at: ${contract.deployTxData.public.contractAddress}\n`);
          return contract;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log(`\n  ✗ Deploy failed: ${msg}\n`);
        }
        break;

      case '2':
        try {
          return await joinContract(providers, rli);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log(`  ✗ Failed to join contract: ${msg}\n`);
        }
        break;

      case '3':
        await startDustMonitor(walletCtx.wallet, rli);
        break;

      case '4':
        return null;

      default:
        console.log(`  Invalid choice: ${choice}`);
    }
  }
};

const mainLoop = async (
  providers: EscrowProviders,
  walletCtx: api.WalletContext,
  rli: Interface,
): Promise<void> => {
  const escrowContract = await deployOrJoin(providers, walletCtx, rli);
  if (escrowContract === null) return;

  console.log(`
${DIVIDER}
  Escrow contract ready.
  Interaction flows (create/accept/release) will be added next.
${DIVIDER}
`);
};

/* ─── Docker Mapping ─────────────────────────────────────── */

const mapContainerPort = (env: StartedDockerComposeEnvironment, url: string, containerName: string) => {
  const mappedUrl = new URL(url);
  const container = env.getContainer(containerName);
  mappedUrl.port = String(container.getFirstMappedPort());
  return mappedUrl.toString().replace(/\/+$/, '');
};

/* ─── Entry Point ────────────────────────────────────────── */

export const run = async (
  config: Config,
  _logger: Logger,
  dockerEnv?: DockerComposeEnvironment,
): Promise<void> => {
  logger = _logger;
  api.setLogger(_logger);

  console.log(BANNER);

  const rli = createInterface({ input, output, terminal: true });
  let env: StartedDockerComposeEnvironment | undefined;

  try {
    if (dockerEnv !== undefined) {
      env = await dockerEnv.up();

      if (config instanceof StandaloneConfig) {
        config.indexer = mapContainerPort(env, config.indexer, 'counter-indexer');
        config.indexerWS = mapContainerPort(env, config.indexerWS, 'counter-indexer');
        config.node = mapContainerPort(env, config.node, 'counter-node');
        config.proofServer = mapContainerPort(env, config.proofServer, 'counter-proof-server');
      }
    }

    const walletCtx = await buildWallet(config, rli);
    if (walletCtx === null) return;

    try {
      const providers = await api.withStatus('Configuring providers', () =>
        api.configureProviders(walletCtx, config),
      );
      console.log('');
      await mainLoop(providers, walletCtx, rli);
    } finally {
      await walletCtx.wallet.stop();
    }
  } finally {
    rli.close();
    if (env) await env.down();
    logger.info('Goodbye.');
  }
};