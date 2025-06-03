// api.js - Express API server for NGN/USD oracle
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const NGNUSDOracle = require('./src/core/NGNUSDOracle');

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize oracle
let oracle;
const initializeOracle = () => {
    const privateKey = process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
    oracle = new NGNUSDOracle(privateKey);
    console.log('Oracle initialized for API server');
};

// Initialize oracle on startup
initializeOracle();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        oracle: oracle ? 'initialized' : 'not initialized'
    });
});

// Get current price
app.get('/api/price', async (req, res) => {
    try {
        const priceData = await oracle.getCurrentPrice();
        res.json({
            success: true,
            data: {
                usdToNgn: priceData.usdToNgn,
                ngnToUsd: priceData.ngnToUsd,
                formattedPrice: priceData.formattedPrice,
                reversePrice: priceData.reversePrice,
                decimals: priceData.decimals,
                description: priceData.description,
                timestamp: priceData.timestamp
            }
        });
    } catch (error) {
        console.error('Error fetching price:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch price data',
            message: error.message
        });
    }
});

// Get latest round data
app.get('/api/round', async (req, res) => {
    try {
        const roundData = await oracle.getLatestRoundData();
        res.json({
            success: true,
            data: {
                roundId: roundData.roundId,
                usdToNgn: roundData.usdToNgn,
                ngnToUsd: roundData.ngnToUsd,
                formattedPrice: roundData.formattedPrice,
                reversePrice: roundData.reversePrice,
                updatedAt: roundData.updatedAt,
                updatedAtFormatted: roundData.updatedAtFormatted,
                answeredInRound: roundData.answeredInRound
            }
        });
    } catch (error) {
        console.error('Error fetching round data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch round data',
            message: error.message
        });
    }
});

// Convert USD to NGN
app.get('/api/convert/usd-to-ngn/:amount', async (req, res) => {
    try {
        const amount = parseFloat(req.params.amount);
        if (isNaN(amount)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount provided'
            });
        }

        const priceData = await oracle.getCurrentPrice();
        const ngnAmount = amount * priceData.usdToNgn;

        res.json({
            success: true,
            data: {
                usdAmount: amount,
                ngnAmount: ngnAmount,
                rate: priceData.usdToNgn,
                formattedResult: `${amount} USD = ${ngnAmount.toFixed(2)} NGN`,
                timestamp: priceData.timestamp
            }
        });
    } catch (error) {
        console.error('Error converting USD to NGN:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to convert currency',
            message: error.message
        });
    }
});

// Convert NGN to USD
app.get('/api/convert/ngn-to-usd/:amount', async (req, res) => {
    try {
        const amount = parseFloat(req.params.amount);
        if (isNaN(amount)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount provided'
            });
        }

        const priceData = await oracle.getCurrentPrice();
        const usdAmount = amount * priceData.ngnToUsd;

        res.json({
            success: true,
            data: {
                ngnAmount: amount,
                usdAmount: usdAmount,
                rate: priceData.ngnToUsd,
                formattedResult: `${amount} NGN = ${usdAmount.toFixed(6)} USD`,
                timestamp: priceData.timestamp
            }
        });
    } catch (error) {
        console.error('Error converting NGN to USD:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to convert currency',
            message: error.message
        });
    }
});

// Get historical events
app.get('/api/history', async (req, res) => {
    try {
        const blocks = parseInt(req.query.blocks) || 50;
        const events = await oracle.queryHistoricalEvents(blocks);
        
        res.json({
            success: true,
            data: {
                events: events,
                count: events.length,
                blocksQueried: blocks
            }
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch historical data',
            message: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 NGN/USD Oracle API Server running on port ${PORT}`);
    console.log(`\n📍 Available endpoints:`);
    console.log(`   GET  /health                    - Health check`);
    console.log(`   GET  /api/price                 - Current price data`);
    console.log(`   GET  /api/round                 - Latest round data`);
    console.log(`   GET  /api/convert/usd-to-ngn/:amount - Convert USD to NGN`);
    console.log(`   GET  /api/convert/ngn-to-usd/:amount - Convert NGN to USD`);
    console.log(`   GET  /api/history?blocks=50     - Historical price events\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down API server...');
    if (oracle) {
        oracle.stopMonitoring();
    }
    process.exit(0);
});