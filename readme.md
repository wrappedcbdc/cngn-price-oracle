# NGN/USD Oracle Client for Base Mainnet

A Node.js client for interacting with Chainlink's cNGN/USD price feed oracle on Base mainnet. This implementation provides real-time exchange rate monitoring, event-driven updates, and historical data queries for the Nigerian Naira to US Dollar pair.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [HTTP API Endpoints](#-http-api-endpoints)
- [Events](#-events)
- [Examples](#-examples)
- [Security Considerations](#-security-considerations)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Overview

This client interfaces with Chainlink's cNGN/USD price feed oracle deployed on Base mainnet at address `0xdfbb5Cbc88E382de007bfe6CE99C388176ED80aD`. The oracle provides reliable, decentralized exchange rate data for the Nigerian Naira (NGN) against the US Dollar (USD).

### About Chainlink cNGN Oracle

Chainlink's cNGN oracle is part of their comprehensive price feed network, providing:

- **Decentralized data aggregation** from multiple sources
- **High reliability** with multiple node operators
- **Tamper-resistant** price information
- **Regular updates** based on market conditions

## ✨ Features

- 🔄 **Real-time Price Monitoring** - Continuous polling of current exchange rates
- 📡 **Event-Driven Architecture** - Listen to price update events in real-time
- 📊 **Historical Data Query** - Access past price updates and events
- ️ **Error Handling** - Robust error management and retry logic
- 📈 **Detailed Logging** - Comprehensive logging for debugging and monitoring

## 📚 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v16.0.0 or higher
- **npm** or **yarn** package manager
- **Git** for version control

You'll also need:

- **RPC endpoint** (default uses public Base RPC)

## 🚀 Installation

1. **Clone the repository**

```bash
git clone https://github.com/wrappedcbdc/cngn-price-oracle.git
cd cngn-price-oracle
```

2. **Install dependencies**

```bash
npm install
```

or with yarn:

```bash
yarn install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Required
ORACLE_CONTRACT_ADDRESS=0xdfbb5Cbc88E382de007bfe6CE99C388176ED80aD

# Optional (defaults provided)
RPC_URL=https://mainnet.base.org
POLLING_INTERVAL=30000  # Price check interval in milliseconds
```

### Network Configuration

The client is configured for Base mainnet by default. Network details:

| Parameter | Value |
|-----------|-------|
| Network | Base Mainnet |
| Chain ID | 8453 |
| Currency | ETH |
| Oracle | Chainlink cNGN/USD |
| Contract | `0xdfbb5Cbc88E382de007bfe6CE99C388176ED80aD` |

## 📖 Usage

### Quick Start

```bash
# Run the oracle client
npm start

# Run in development mode with auto-restart
npm run dev
```

### API Server

```bash
# Start the API server
npm run api         # production mode
npm run dev:api     # development mode with auto-restart
```

### Basic Implementation

```javascript
const { NGNUSDOracle } = require('./oracle');
const { ethers } = require('ethers');

const rpcUrl = "https://mainnet.base.org";
const provider = new ethers.JsonRpcProvider(rpcUrl);

async function main() {
    // Initialize the oracle client
    const oracle = new NGNUSDOracle(provider);
    
    // Get current price
    const price = await oracle.getCurrentPrice();
    console.log(`Current rate: ${price.formattedPrice}`);
    
    // Start monitoring with events
    oracle.setupEventListeners();
    await oracle.monitorPrice(60000); // Check every minute
}

main().catch(console.error);
```

## 📚 API Reference

### Constructor

```javascript
new NGNUSDOracle(provider)
```

Creates a new instance of the NGN/USD oracle client.

**Parameters:**
- `provider` (ethers.Provider): An ethers.js provider connected to Base mainnet

### Methods

#### `getCurrentPrice()`

Fetches the current NGN/USD exchange rate.

**Returns:** `Promise<Object>`

```javascript
{
    price: 1450.50,              // Numeric price
    decimals: 8,                 // Price decimals
    timestamp: 1699564800,       // Unix timestamp
    formattedPrice: "1 USD = 1450.50 NGN"  // Human-readable format
}
```

#### `getLatestRoundData()`

Retrieves detailed information about the latest price update round.

**Returns:** `Promise<Object>`

```javascript
{
    roundId: "18446744073709562776",
    answer: 145050000000,        // Raw price with decimals
    startedAt: 1699564800,
    updatedAt: 1699564800,
    answeredInRound: "18446744073709562776"
}
```

#### `setupEventListeners()`

Initializes event listeners for real-time updates.

```javascript
oracle.setupEventListeners();
```

#### `monitorPrice(intervalMs)`

Starts continuous price monitoring.

**Parameters:**
- `intervalMs` (number): Polling interval in milliseconds (default: 60000)

#### `queryHistoricalEvents(fromBlock, toBlock)`

Queries past price update events.

**Parameters:**
- `fromBlock` (number|string): Starting block number or 'latest'
- `toBlock` (number|string): Ending block number or 'latest'

**Returns:** `Promise<Array>` of event objects

## 🌐 HTTP API Endpoints

The project includes a REST API server (implemented in `api.js`) that exposes HTTP endpoints for easy integration with web applications and external services.

### GET /health

Health check endpoint to verify API server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "oracle": "initialized"
}
```

### GET /api/price

Retrieves the current NGN/USD exchange rate with comprehensive price data.

**Response:**
```json
{
  "success": true,
  "data": {
    "usdToNgn": 1450.50,
    "ngnToUsd": 0.000689,
    "formattedPrice": "1 USD = 1450.50 NGN",
    "reversePrice": "1 NGN = 0.000689 USD",
    "decimals": 8,
    "description": "NGN/USD",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /api/round

Fetches detailed information about the latest price update round.

**Response:**
```json
{
  "success": true,
  "data": {
    "roundId": "18446744073709562776",
    "usdToNgn": 1450.50,
    "ngnToUsd": 0.000689,
    "formattedPrice": "1 USD = 1450.50 NGN",
    "reversePrice": "1 NGN = 0.000689 USD",
    "updatedAt": 1699564800,
    "updatedAtFormatted": "2024-01-15T10:30:00.000Z",
    "answeredInRound": "18446744073709562776"
  }
}
```

### GET /api/convert/usd-to-ngn/:amount

Converts a specified USD amount to NGN using the current exchange rate.

**Parameters:**
- `amount` (path parameter): USD amount to convert (must be a valid number)

**Example:** `/api/convert/usd-to-ngn/100`

**Response:**
```json
{
  "success": true,
  "data": {
    "usdAmount": 100,
    "ngnAmount": 145050,
    "rate": 1450.50,
    "formattedResult": "100 USD = 145050.00 NGN",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /api/convert/ngn-to-usd/:amount

Converts a specified NGN amount to USD using the current exchange rate.

**Parameters:**
- `amount` (path parameter): NGN amount to convert (must be a valid number)

**Example:** `/api/convert/ngn-to-usd/145050`

**Response:**
```json
{
  "success": true,
  "data": {
    "ngnAmount": 145050,
    "usdAmount": 100.000000,
    "rate": 0.000689,
    "formattedResult": "145050 NGN = 100.000000 USD",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /api/history?blocks=<number>

Retrieves historical price update events from the blockchain.

**Parameters:**
- `blocks` (query parameter, optional): Number of blocks to query (default: 50)

**Example:** `/api/history?blocks=100`

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "roundId": "18446744073709562776",
        "price": 1450.50,
        "formattedPrice": "1 USD = 1450.50 NGN",
        "updatedAt": 1699564800,
        "updatedAtFormatted": "2024-01-15T10:30:00.000Z",
        "blockNumber": 12345678,
        "transactionHash": "0x..."
      }
    ],
    "count": 25,
    "blocksQueried": 100
  }
}
```

**Error Response Format:**

All endpoints return errors in the following format:
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

## 📡 Events

The oracle emits the following events:

### `AnswerUpdated`

Emitted when the oracle price is updated.

```javascript
oracle.contract.on('AnswerUpdated', (current, roundId, updatedAt, event) => {
    console.log('New price:', current);
    console.log('Round ID:', roundId);
    console.log('Updated at:', updatedAt);
});
```

## 💡 Examples

### Example 1: Simple Price Check

```javascript
async function checkPrice() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const oracle = new NGNUSDOracle(provider);
    const { formattedPrice } = await oracle.getCurrentPrice();
    console.log(formattedPrice);
}
```

### Example 2: Historical Analysis

```javascript
async function analyzeHistory() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const oracle = new NGNUSDOracle(provider);
    const events = await oracle.queryHistoricalEvents(1000);
    
    events.forEach(event => {
        console.log(`${event.updatedAtFormatted}: ${event.formattedPrice}`);
    });
}
```

### Example 3: Price Alert System

```javascript
async function priceAlerts() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const oracle = new NGNUSDOracle(provider);
    const threshold = 1500; // Alert if 1 USD > 1500 NGN
    
    oracle.contract.on('AnswerUpdated', async (current, roundId, updatedAt) => {
        const decimals = await oracle.contract.decimals();
        const rate = Number(current) / Math.pow(10, Number(decimals));
        
        if (rate > threshold) {
            console.log(`🚨 ALERT: NGN/USD rate exceeded ${threshold}!`);
            // Send notification, email, etc.
        }
    });
}
```

## 🔒 Security Considerations

1. **RPC Security**
   - Use private RPC endpoints for production
   - Implement rate limiting to avoid DOS
   - Monitor for unusual activity

2. **Best Practices**

```javascript
// Good: Using environment variable for RPC
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const oracle = new NGNUSDOracle(provider);
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Connection Errors

```
Error: Could not connect to Base mainnet
```

**Solution:** Check your internet connection and RPC endpoint availability.

#### 2. Invalid ABI

```
Error: Contract method not found
```

**Solution:** Verify you're using the correct contract ABI.

### Debug Mode

Enable debug logging:

```javascript
const provider = new ethers.JsonRpcProvider(rpcUrl);
const oracle = new NGNUSDOracle(provider);
```

### Health Check

```javascript
async function healthCheck() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const oracle = new NGNUSDOracle(provider);
    
    try {
        await oracle.getCurrentPrice();
        console.log('✅ Oracle is healthy');
    } catch (error) {
        console.error('❌ Oracle health check failed:', error);
    }
}
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Install development dependencies
npm install --save-dev

# Run tests
npm test

# Run linter
npm run lint

# Build documentation
npm run docs
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [Chainlink Documentation](https://docs.chain.link/)
- [Base Network Documentation](https://docs.base.org/)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [Oracle Contract on Basescan](https://basescan.org/address/0xdfbb5Cbc88E382de007bfe6CE99C388176ED80aD)
- [Base Bridge](https://bridge.base.org/)
- [Chainlink Price Feeds](https://data.chain.link/)

## 📞 Support

- Open an issue on [GitHub](https://github.com/wrappedcbdc/cngn-price-oracle/issues)
- Email: [contact@cngn.co](mailto:contact@cngn.co)

---

**Disclaimer:** This software is provided "as is" without warranty of any kind. Always test thoroughly before using in production environments.
