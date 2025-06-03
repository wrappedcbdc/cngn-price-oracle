// src/core/NGNUSDOracle.js
const { ethers } = require('ethers');
const pLimit = require('p-limit');
const ORACLE_ABI = require('../abi/oracleAbi');

const RPC_ENDPOINTS = [
    'https://mainnet.base.org',
    'https://base.llamarpc.com',
    'https://base.drpc.org',
    'https://base.meowrpc.com'
];

const ORACLE_CONTRACT_ADDRESS = process.env.ORACLE_CONTRACT_ADDRESS;
const limit = pLimit(1);

class NGNUSDOracle {
    constructor(privateKey) {
        // Initialize with RPC rotation
        this.rpcIndex = 0;
        this.rpcEndpoints = RPC_ENDPOINTS;
        this.initializeProvider();
        
        // Initialize wallet
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        
        // Initialize contract
        this.contract = new ethers.Contract(
            ORACLE_CONTRACT_ADDRESS,
            ORACLE_ABI,
            this.provider
        );
        
        // Cache for static values
        this.cachedDecimals = null;
        this.cachedDescription = null;
        
        // Event listeners storage
        this.eventListeners = [];
        this.activeListeners = new Map();
        
        console.log('Oracle initialized with address:', ORACLE_CONTRACT_ADDRESS);
    }

    // Initialize or rotate provider
    initializeProvider() {
        this.provider = new ethers.JsonRpcProvider(this.rpcEndpoints[this.rpcIndex]);
        console.log(`Using RPC endpoint: ${this.rpcEndpoints[this.rpcIndex]}`);
    }

    // Rotate to next RPC endpoint
    rotateRPC() {
        // Remove existing event listeners before switching
        this.removeAllListeners();
        
        this.rpcIndex = (this.rpcIndex + 1) % this.rpcEndpoints.length;
        this.initializeProvider();
        
        // Reinitialize contract with new provider
        this.contract = new ethers.Contract(
            ORACLE_CONTRACT_ADDRESS,
            ORACLE_ABI,
            this.provider
        );
        
        // Re-setup event listeners if they were active
        if (this.activeListeners.size > 0) {
            console.log('Re-establishing event listeners...');
            this.reestablishEventListeners();
        }
        
        console.log(`Rotated to RPC endpoint: ${this.rpcEndpoints[this.rpcIndex]}`);
    }

    // Remove all event listeners
    removeAllListeners() {
        try {
            this.contract.removeAllListeners();
        } catch (error) {
            // Ignore errors when removing listeners
        }
    }

    // Re-establish event listeners after RPC rotation
    reestablishEventListeners() {
        const listeners = Array.from(this.activeListeners.entries());
        this.activeListeners.clear();
        
        listeners.forEach(([eventName, listener]) => {
            try {
                this.contract.on(eventName, listener);
                this.activeListeners.set(eventName, listener);
            } catch (error) {
                console.error(`Failed to re-establish listener for ${eventName}:`, error.message);
            }
        });
    }

    // Execute with retry and RPC rotation
    async executeWithRetry(fn, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error) {
                const isRateLimit = error.info?.error?.message?.includes('rate limit') || 
                                  error.code === -32016;
                const isFilterError = error.error?.message?.includes('filter not found');
                
                if (isRateLimit || isFilterError) {
                    console.log(`${isRateLimit ? 'Rate limit' : 'Filter error'} hit, rotating RPC... (attempt ${i + 1}/${retries})`);
                    this.rotateRPC();
                    
                    // Wait before retry with exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, i), 10000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else if (i === retries - 1) {
                    throw error;
                }
            }
        }
    }

    // Get cached decimals
    async getDecimals() {
        if (this.cachedDecimals === null) {
            this.cachedDecimals = await this.executeWithRetry(async () => {
                return Number(await this.contract.decimals());
            });
        }
        return this.cachedDecimals;
    }

    // Get cached description
    async getDescription() {
        if (this.cachedDescription === null) {
            this.cachedDescription = await this.executeWithRetry(async () => {
                return await this.contract.description();
            });
        }
        return this.cachedDescription;
    }

    // Read current price with proper conversion
    async getCurrentPrice() {
        return limit(async () => {
            try {
                const decimals = await this.getDecimals();
                const description = await this.getDescription();
                
                const latestAnswer = await this.executeWithRetry(async () => {
                    return await this.contract.latestAnswer();
                });

                // Oracle returns NGN/USD (how many USD per 1 NGN)
                const ngnToUsd = Number(latestAnswer) / Math.pow(10, decimals);
                
                // Convert to USD/NGN (how many NGN per 1 USD)
                const usdToNgn = 1 / ngnToUsd;
                
                return {
                    ngnToUsd: ngnToUsd,
                    usdToNgn: usdToNgn,
                    decimals: decimals,
                    description: description,
                    formattedPrice: `1 USD = ${usdToNgn.toFixed(2)} NGN`,
                    reversePrice: `1 NGN = ${ngnToUsd.toFixed(6)} USD`,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                console.error('Error fetching current price:', error);
                throw error;
            }
        });
    }

    // Get detailed round data with rate limiting
    async getLatestRoundData() {
        return limit(async () => {
            try {
                const decimals = await this.getDecimals();
                
                const roundData = await this.executeWithRetry(async () => {
                    return await this.contract.latestRoundData();
                });
                
                // Oracle returns NGN/USD
                const ngnToUsd = Number(roundData.answer) / Math.pow(10, decimals);
                // Convert to USD/NGN
                const usdToNgn = 1 / ngnToUsd;
                
                return {
                    roundId: roundData.roundId.toString(),
                    answer: Number(roundData.answer),
                    ngnToUsd: ngnToUsd,
                    usdToNgn: usdToNgn,
                    formattedPrice: `1 USD = ${usdToNgn.toFixed(2)} NGN`,
                    reversePrice: `1 NGN = ${ngnToUsd.toFixed(6)} USD`,
                    startedAt: Number(roundData.startedAt),
                    updatedAt: Number(roundData.updatedAt),
                    answeredInRound: roundData.answeredInRound.toString(),
                    updatedAtFormatted: new Date(Number(roundData.updatedAt) * 1000).toISOString()
                };
            } catch (error) {
                console.error('Error fetching round data:', error);
                throw error;
            }
        });
    }

    // Set up event listeners for price updates (disabled due to filter issues)
    setupEventListeners() {
        console.log('Event listeners disabled due to RPC filter limitations');
        // Comment out to avoid filter errors with rotating RPCs
        /*
        const answerUpdatedListener = async (...args) => {
            try {
                const [current, roundId, updatedAt, event] = args;
                const decimals = await this.getDecimals();
                
                const ngnToUsd = Number(current) / Math.pow(10, decimals);
                const usdToNgn = 1 / ngnToUsd;
                
                console.log('\n🔔 Price Update Event:');
                console.log(`   Round ID: ${roundId}`);
                console.log(`   Price: 1 USD = ${usdToNgn.toFixed(2)} NGN`);
                console.log(`         1 NGN = ${ngnToUsd.toFixed(6)} USD`);
                console.log(`   Updated: ${new Date(Number(updatedAt) * 1000).toISOString()}`);
                console.log(`   Block: ${event.log.blockNumber}`);
                console.log(`   Transaction: ${event.log.transactionHash}\n`);
            } catch (error) {
                console.error('Error processing price update event:', error);
            }
        };

        try {
            this.contract.on('AnswerUpdated', answerUpdatedListener);
            this.activeListeners.set('AnswerUpdated', answerUpdatedListener);
            console.log('Event listeners set up successfully');
        } catch (error) {
            console.error('Failed to setup event listeners:', error.message);
        }
        */
    }

    // Query historical events with reduced block range
    async queryHistoricalEvents(blockRange = 100, batchSize = 50) {
        try {
            console.log(`Querying historical events (last ${blockRange} blocks)...`);
            
            const currentBlock = await this.executeWithRetry(async () => {
                return await this.provider.getBlockNumber();
            });
            
            const fromBlock = currentBlock - blockRange;
            
            // Single batch for small ranges
            if (blockRange <= batchSize) {
                const filter = this.contract.filters.AnswerUpdated();
                const events = await limit(async () => {
                    return await this.executeWithRetry(async () => {
                        return await this.contract.queryFilter(filter, fromBlock, currentBlock);
                    });
                });
                
                return this.processEvents(events);
            }
            
            // Split into batches for larger ranges
            const batches = [];
            for (let i = fromBlock; i <= currentBlock; i += batchSize) {
                batches.push({
                    from: i,
                    to: Math.min(i + batchSize - 1, currentBlock)
                });
            }

            console.log(`Querying in ${batches.length} batches...`);

            // Query batches with rate limiting
            const batchPromises = batches.map(batch => 
                limit(async () => {
                    try {
                        const filter = this.contract.filters.AnswerUpdated();
                        return await this.executeWithRetry(async () => {
                            return await this.contract.queryFilter(filter, batch.from, batch.to);
                        });
                    } catch (error) {
                        console.error(`Error querying batch ${batch.from}-${batch.to}:`, error.message);
                        return [];
                    }
                })
            );

            const batchResults = await Promise.all(batchPromises);
            const events = batchResults.flat();
            
            console.log(`Found ${events.length} price update events`);
            
            return this.processEvents(events);
        } catch (error) {
            console.error('Error querying historical events:', error);
            return [];
        }
    }

    // Process events helper
    async processEvents(events) {
        const decimals = await this.getDecimals();
        
        return events.map(event => {
            const ngnToUsd = Number(event.args.current) / Math.pow(10, decimals);
            const usdToNgn = 1 / ngnToUsd;
            
            return {
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                roundId: event.args.roundId.toString(),
                ngnToUsd: ngnToUsd,
                usdToNgn: usdToNgn,
                formattedPrice: `1 USD = ${usdToNgn.toFixed(2)} NGN`,
                reversePrice: `1 NGN = ${ngnToUsd.toFixed(6)} USD`,
                updatedAt: Number(event.args.updatedAt),
                updatedAtFormatted: new Date(Number(event.args.updatedAt) * 1000).toISOString()
            };
        });
    }

    // Monitor price continuously with error handling
    async monitorPrice(intervalMs = 60000) {
        console.log(`Starting price monitoring (interval: ${intervalMs/1000}s)...`);
        
        // Initial price check
        await this.displayCurrentPrice();
        
        // Set up periodic checks with error handling
        this.monitorInterval = setInterval(async () => {
            try {
                await this.displayCurrentPrice();
            } catch (error) {
                console.error('Error during price monitoring:', error.message);
            }
        }, intervalMs);
    }

    // Stop monitoring and cleanup
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            console.log('Price monitoring stopped');
        }

        // Remove all event listeners
        this.removeAllListeners();
        this.activeListeners.clear();
    }

    // Helper to display current price with round data
    async displayCurrentPrice() {
        const priceData = await this.getCurrentPrice();
        console.log(`\n📊 Current Exchange Rates:`);
        console.log(`   ${priceData.formattedPrice}`);
        console.log(`   ${priceData.reversePrice}`);
        console.log(`   Last Checked: ${priceData.timestamp}`);
    }
}

module.exports = NGNUSDOracle;