// Import required dependencies
const { ethers } = require('ethers');
require('dotenv').config();
const NGNUSDOracle = require('./src/core/NGNUSDOracle');

// Main execution
async function main() {
    let oracle;
    
    try {
        // For read-only operations, you can use a dummy private key
        const privateKey = process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
        
        // Initialize oracle
        oracle = new NGNUSDOracle(privateKey);

        // Get oracle description
        const description = await oracle.getDescription();
        console.log(`\n📌 Connected to: ${description}`);
        console.log(`📍 Contract: ${process.env.ORACLE_CONTRACT_ADDRESS}\n`);

        // Get current price
        console.log('Fetching current NGN/USD rate...');
        const currentPrice = await oracle.getCurrentPrice();
        console.log('Current Price Data:', {
            usdToNgn: currentPrice.usdToNgn.toFixed(2),
            ngnToUsd: currentPrice.ngnToUsd.toFixed(6),
            formattedPrice: currentPrice.formattedPrice,
            reversePrice: currentPrice.reversePrice
        });

        // Get latest round data
        try {
            const roundData = await oracle.getLatestRoundData();
            console.log('\nLatest Round Data:', {
                roundId: roundData.roundId,
                formattedPrice: roundData.formattedPrice,
                reversePrice: roundData.reversePrice,
                updatedAt: roundData.updatedAtFormatted
            });
        } catch (error) {
            console.error('Could not fetch round data:', error.message);
        }

        // Setup event listeners
        oracle.setupEventListeners();

        // Query recent events with reduced block range
        const recentEvents = await oracle.queryHistoricalEvents(50); // Reduced from 500 to 50
        if (recentEvents.length > 0) {
            console.log('\nRecent Price Updates:');
            recentEvents.slice(0, 3).forEach((event, index) => {
                console.log(`${index + 1}. ${event.formattedPrice} (${event.reversePrice}) at ${event.updatedAtFormatted}`);
            });
        }

        // Start monitoring with longer interval
        await oracle.monitorPrice(120000); // Check every 2 minutes instead of 30 seconds

        // Keep the script running
        console.log('\n✅ Oracle monitor is running. Press Ctrl+C to exit.');
        
    } catch (error) {
        console.error('Main execution error:', error);
        process.exit(1);
    }
}

// Run the script
main();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down oracle monitor...');
    if (global.oracle) {
        global.oracle.stopMonitoring();
    }
    process.exit(0);
});