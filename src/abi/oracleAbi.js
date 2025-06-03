// src/abi/oracleAbi.js

const ORACLE_ABI = [
    // Events
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "int256", "name": "current", "type": "int256"},
            {"indexed": true, "internalType": "uint256", "name": "roundId", "type": "uint256"},
            {"indexed": false, "internalType": "uint256", "name": "updatedAt", "type": "uint256"}
        ],
        "name": "AnswerUpdated",
        "type": "event"
    },
    
    // Essential read functions
    {
        "inputs": [],
        "name": "latestAnswer",
        "outputs": [{"internalType": "int256", "name": "", "type": "int256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "latestRoundData",
        "outputs": [
            {"internalType": "uint80", "name": "roundId", "type": "uint80"},
            {"internalType": "int256", "name": "answer", "type": "int256"},
            {"internalType": "uint256", "name": "startedAt", "type": "uint256"},
            {"internalType": "uint256", "name": "updatedAt", "type": "uint256"},
            {"internalType": "uint80", "name": "answeredInRound", "type": "uint80"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "description",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }
];

module.exports = ORACLE_ABI;