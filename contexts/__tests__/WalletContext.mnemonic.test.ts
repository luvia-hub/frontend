import { ethers } from 'ethers';

// A known test mnemonic and its derived address (BIP-39 / BIP-44 default path)
const TEST_MNEMONIC =
  'test test test test test test test test test test test junk';

// Sanity-check that ethers.Wallet.fromPhrase works as expected before we rely
// on it in WalletContext.
describe('ethers.Wallet.fromPhrase (mnemonic phrase support)', () => {
  it('creates a wallet from a valid 12-word mnemonic', () => {
    const wallet = ethers.Wallet.fromPhrase(TEST_MNEMONIC);
    expect(wallet).toBeInstanceOf(ethers.Wallet);
    expect(wallet.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it('derives a deterministic address from the same mnemonic', () => {
    const wallet1 = ethers.Wallet.fromPhrase(TEST_MNEMONIC);
    const wallet2 = ethers.Wallet.fromPhrase(TEST_MNEMONIC);
    expect(wallet1.address).toBe(wallet2.address);
  });

  it('throws for an invalid mnemonic phrase', () => {
    expect(() => ethers.Wallet.fromPhrase('not a valid mnemonic phrase at all')).toThrow();
  });

  it('throws for an empty mnemonic phrase', () => {
    expect(() => ethers.Wallet.fromPhrase('')).toThrow();
  });

  it('can sign typed data after being created from a mnemonic', async () => {
    const wallet = ethers.Wallet.fromPhrase(TEST_MNEMONIC);
    const domain: ethers.TypedDataDomain = {
      name: 'TestApp',
      version: '1',
      chainId: 1,
    };
    const types = {
      Order: [
        { name: 'amount', type: 'uint256' },
        { name: 'trader', type: 'address' },
      ],
    };
    const value = { amount: 100n, trader: wallet.address };
    const signature = await wallet.signTypedData(domain, types, value);
    expect(signature).toMatch(/^0x[0-9a-fA-F]+$/);
  });
});
