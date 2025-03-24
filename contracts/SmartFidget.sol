// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SmartFidget {
    address public immutable owner;

    // Map user address to date to IPFS hash and encryption key
    mapping(address => mapping(string => string)) public userDateToIPFS;
    mapping(address => mapping(string => string)) public userDateToEncryptionKey;

    // Keep track of all dates for each user
    mapping(address => string[]) private userDates;

    // Event emitted when a new record is added
    event RecordAdded(address indexed user, string date, string ipfsHash, string encryptionKey);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized");
        _;
    }

    // Add a new record to the contract
    function addRecord(string memory _date, string memory _ipfsHash, string memory _encryptionKey) public {
        // Store the mapping: user address -> date -> IPFS hash
        userDateToIPFS[msg.sender][_date] = _ipfsHash;

        // Store the encryption key
        userDateToEncryptionKey[msg.sender][_date] = _encryptionKey;

        // Check if this is a new date for this user
        bool dateExists = false;
        for (uint i = 0; i < userDates[msg.sender].length; i++) {
            if (keccak256(bytes(userDates[msg.sender][i])) == keccak256(bytes(_date))) {
                dateExists = true;
                break;
            }
        }

        // If it's a new date, add it to the user's dates array
        if (!dateExists) {
            userDates[msg.sender].push(_date);
        }

        emit RecordAdded(msg.sender, _date, _ipfsHash, _encryptionKey);
    }

    // Get IPFS hash for a specific user and date
    function getIPFSHash(address _user, string memory _date) public view returns (string memory) {
        return userDateToIPFS[_user][_date];
    }

    // Get encryption key for a specific user and date
    function getEncryptionKey(address _user, string memory _date) public view returns (string memory) {
        return userDateToEncryptionKey[_user][_date];
    }

    // Get all dates with records for a specific user
    function getUserDates(address _user) public view returns (string[] memory) {
        return userDates[_user];
    }

    // Get number of dates with records for a specific user
    function getUserDatesCount(address _user) public view returns (uint256) {
        return userDates[_user].length;
    }

    // Get IPFS hash for a specific date for the caller
    function getMyIPFSHash(string memory _date) public view returns (string memory) {
        return userDateToIPFS[msg.sender][_date];
    }

    // Get encryption key for a specific date for the caller
    function getMyEncryptionKey(string memory _date) public view returns (string memory) {
        return userDateToEncryptionKey[msg.sender][_date];
    }

    // Get all dates with records for the caller
    function getMyDates() public view returns (string[] memory) {
        return userDates[msg.sender];
    }
}