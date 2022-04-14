# Putty

Putty is an exotic options market for NFTs and ERC20s

**Links:**

* [putty.finance](https://putty.finance)
* [testnet.putty.finance](https://testnet.putty.finance)

**Note:**

These contracts are very simple. All logic is contained in the single `contracts/Putty.sol` file.

**Flow:**

A buyer creates an off-chain option order, signs it and then a seller fills that option order on-chain.
The only data stored on-chain is the hash of option details (strike, duration, etc.).
When an option is exercised/expired, the user submits all of the order details and the hash is then derived and verified on-chain.

---

## Installation

```shell
npm install
```

## Testing

```shell
npx hardhat test
```

## Deploy

The following will deploy to localhost (hardhat node):

```shell
npx hardhat node
npx hardhat deploy --network localhost
```

## Docs

```shell
npx hardhat dodoc
```

## Coverage

```
npx hardhat coverage
```

```
------------|----------|----------|----------|----------|----------------|
File        |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
------------|----------|----------|----------|----------|----------------|
 contracts/ |      100 |    88.46 |      100 |      100 |                |
  Putty.sol |      100 |    88.46 |      100 |      100 |                |
------------|----------|----------|----------|----------|----------------|
All files   |      100 |    88.46 |      100 |      100 |                |
------------|----------|----------|----------|----------|----------------|
```

## Lint

```
npm run lint
```