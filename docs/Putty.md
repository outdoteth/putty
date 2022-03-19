# Putty

*out.eth*

> Putty - https://putty.finance

Exotic option market for NFTs and ERC20s



## Methods

### approve

```solidity
function approve(address to, uint256 tokenId) external nonpayable
```



*See {IERC721-approve}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | undefined |
| tokenId | uint256 | undefined |

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```



*See {IERC721-balanceOf}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### baseURI

```solidity
function baseURI() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### cancel

```solidity
function cancel(Putty.Option option) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| option | Putty.Option | undefined |

### cancelledOrders

```solidity
function cancelledOrders(uint256) external view returns (bool)
```

Gets whether or not a long option NFT buy order has been cancelled



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### domainSeparatorV4

```solidity
function domainSeparatorV4() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### exercise

```solidity
function exercise(Putty.Option option) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| option | Putty.Option | undefined |

### expire

```solidity
function expire(Putty.Option option) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| option | Putty.Option | undefined |

### feeRate

```solidity
function feeRate() external view returns (uint256)
```

Current fee rate - ex: 1.9% = 1.9 * 1000 = 1900




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### fillBuyOrder

```solidity
function fillBuyOrder(Putty.Option option, bytes signature) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| option | Putty.Option | undefined |
| signature | bytes | undefined |

### filledOrders

```solidity
function filledOrders(uint256 tokenId) external view returns (bool)
```

Checks whether a buy order has been filled or not



#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenId | uint256 | The tokenId of the option to check |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### getApproved

```solidity
function getApproved(uint256 tokenId) external view returns (address)
```



*See {IERC721-getApproved}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenId | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### isApprovedForAll

```solidity
function isApprovedForAll(address owner, address operator) external view returns (bool)
```



*See {IERC721-isApprovedForAll}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |
| operator | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### name

```solidity
function name() external view returns (string)
```



*See {IERC721Metadata-name}.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### ownerOf

```solidity
function ownerOf(uint256 tokenId) external view returns (address)
```



*See {IERC721-ownerOf}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenId | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId) external nonpayable
```



*See {IERC721-safeTransferFrom}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| from | address | undefined |
| to | address | undefined |
| tokenId | uint256 | undefined |

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data) external nonpayable
```



*See {IERC721-safeTransferFrom}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| from | address | undefined |
| to | address | undefined |
| tokenId | uint256 | undefined |
| _data | bytes | undefined |

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) external nonpayable
```



*See {IERC721-setApprovalForAll}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| operator | address | undefined |
| approved | bool | undefined |

### setBaseURI

```solidity
function setBaseURI(string baseURI_) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| baseURI_ | string | undefined |

### setFeeRate

```solidity
function setFeeRate(uint256 feeRate_) external nonpayable
```

Admin function which sets the fee that is collected on exercise



#### Parameters

| Name | Type | Description |
|---|---|---|
| feeRate_ | uint256 | The new fee rate |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```



*See {IERC165-supportsInterface}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| interfaceId | bytes4 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### symbol

```solidity
function symbol() external view returns (string)
```



*See {IERC721Metadata-symbol}.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### tokenIdToCreationTimestamp

```solidity
function tokenIdToCreationTimestamp(uint256) external view returns (uint256)
```

Gets the creation timestamp of a particular long option NFT



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### tokenURI

```solidity
function tokenURI(uint256 tokenId) external view returns (string)
```



*See {IERC721Metadata-tokenURI}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenId | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 tokenId) external nonpayable
```



*See {IERC721-transferFrom}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| from | address | undefined |
| to | address | undefined |
| tokenId | uint256 | undefined |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### uncollectedFees

```solidity
function uncollectedFees() external view returns (uint256)
```

Fees which have yet to be collected by the admin




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### weth

```solidity
function weth() external view returns (contract ERC20)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ERC20 | undefined |

### withdrawFees

```solidity
function withdrawFees(address recipient) external nonpayable
```

Admin function which withdraws uncollected fees to `recipient`



#### Parameters

| Name | Type | Description |
|---|---|---|
| recipient | address | The account which will receive the fees |



## Events

### Approval

```solidity
event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner `indexed` | address | undefined |
| approved `indexed` | address | undefined |
| tokenId `indexed` | uint256 | undefined |

### ApprovalForAll

```solidity
event ApprovalForAll(address indexed owner, address indexed operator, bool approved)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner `indexed` | address | undefined |
| operator `indexed` | address | undefined |
| approved  | bool | undefined |

### BuyFilled

```solidity
event BuyFilled(Putty.Option option, address indexed seller, uint256 tokenId, uint256 shortTokenId)
```

Fires when a buy order has been filled and an option contract is created



#### Parameters

| Name | Type | Description |
|---|---|---|
| option  | Putty.Option | The newly created option |
| seller `indexed` | address | The account that filled the buy order |
| tokenId  | uint256 | The token ID of the newly created long option NFT |
| shortTokenId  | uint256 | The token ID of the newly created short option NFT |

### Cancelled

```solidity
event Cancelled(Putty.Option option)
```

Fires when a an open buy order is cancelled



#### Parameters

| Name | Type | Description |
|---|---|---|
| option  | Putty.Option | The option for the buy order which is being cancelled |

### Exercised

```solidity
event Exercised(Putty.Option option, address indexed seller, uint256 tokenId, uint256 shortTokenId)
```

Fires when a an option is exercised



#### Parameters

| Name | Type | Description |
|---|---|---|
| option  | Putty.Option | The option which is being exercised |
| seller `indexed` | address | The account that currently holds the short option NFT |
| tokenId  | uint256 | The token ID of the long option NFT |
| shortTokenId  | uint256 | The token ID of the short option NFT |

### Expired

```solidity
event Expired(Putty.Option option, address indexed seller, uint256 tokenId, uint256 shortTokenId)
```

Fires when a an option expires



#### Parameters

| Name | Type | Description |
|---|---|---|
| option  | Putty.Option | The option that has expired |
| seller `indexed` | address | The account that currently holds the short option NFT |
| tokenId  | uint256 | The token ID of the long option NFT |
| shortTokenId  | uint256 | The token ID of the short option NFT |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### Transfer

```solidity
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| from `indexed` | address | undefined |
| to `indexed` | address | undefined |
| tokenId `indexed` | uint256 | undefined |



