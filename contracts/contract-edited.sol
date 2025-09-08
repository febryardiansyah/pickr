// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OnchainRaffle {
    // model
    struct Raffle {
        address creator;
        uint256 balance;
        bool active;
        uint256 maxParticipant;
        uint256 minParticipant;
        uint256 totalParticipant;
    }

    uint256 public nextRaffleId;

    mapping(uint256 => Raffle) public raffles;
    mapping(uint256 => mapping(address => bool)) private hasJoined;
    mapping(uint256 => address) public winner;

    // event
    event RaffleCreated(
        uint256 indexed id,
        address indexed creator,
        uint256 initialDeposit
    );
    event RaffleStarted(uint256 indexed id);
    event WinnerSelected(
        uint256 indexed id,
        address indexed winner,
        uint256 prize
    );
    event Deposited(
        uint256 indexed id,
        address indexed creator,
        uint256 amount
    );
    event JoinRaffle(uint256 indexed id, address indexed user);
    event LeaveRaffle(uint256 indexed id, address indexed user);
    event Claimed(
        uint256 indexed id,
        address indexed userClaim,
        uint256 claimAmount
    );
    event RaffleClosed(uint256 indexed id);

    // main function
    function createRaffle(
        uint256 maxParticipant,
        uint256 minParticipant
    ) external payable returns (uint256) {
        require(msg.value > 0, "Initial deposit is required");
        require(
            maxParticipant > minParticipant,
            "Max participant must be greater than min participant"
        );
        require(minParticipant > 0, "Min participant must be greater than 0");

        raffles[nextRaffleId] = Raffle(
            msg.sender,
            msg.value,
            true,
            maxParticipant,
            minParticipant,
            0
        );
        emit RaffleCreated(nextRaffleId, msg.sender, msg.value);
        return nextRaffleId++;
    }

    function deposit(uint256 raffleId) external payable {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.active, "Raffle is already inactive");
        require(msg.value > 0, "Deposit must be greater than 0");

        raffle.balance += msg.value;

        emit Deposited(raffleId, msg.sender, msg.value);
    }

    function startRaffle(uint256 raffleId) external {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.active, "Raffle is already inactive");
        require(raffle.creator == msg.sender, "You are not the host");
        require(
            raffle.totalParticipant >= raffle.minParticipant,
            "Not enough participants"
        );
        require(raffle.totalParticipant > 0, "No participants");

        raffle.active = false;

        emit RaffleStarted(raffleId);
    }

    function joinRaffle(uint256 raffleId) external {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.active, "Raffle is already inactive");
        require(
            raffle.totalParticipant < raffle.maxParticipant,
            "Raffle is full"
        );
        bool joined = hasJoined[raffleId][msg.sender];
        require(!joined, "You have already joined");

        hasJoined[raffleId][msg.sender] = true;
        raffle.totalParticipant++;

        emit JoinRaffle(raffleId, msg.sender);
    }

    function leaveRaffle(uint256 raffleId) external {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.active, "Raffle is already inactive");
        bool joined = hasJoined[raffleId][msg.sender];
        require(joined, "You have not joined the raffle yet");

        hasJoined[raffleId][msg.sender] = false;
        emit LeaveRaffle(raffleId, msg.sender);
    }

    function claimReward(uint256 raffleId) external {
        Raffle storage raffle = raffles[raffleId];
        require(!raffle.active, "Raffle not ended");
        address w = winner[raffleId];
        require(w != address(0), "Winner not selected");
        require(msg.sender == w, "Not the winner");

        uint256 amount = raffle.balance;
        require(amount > 0, "Nothing to claim");
        raffle.balance = 0;
        emit Claimed(raffleId, msg.sender, amount);
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");
    }

    function closeRaffle(uint256 raffleId) external {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.creator == msg.sender, "You are not the host");
        require(raffle.active, "Raffle is already inactive");
        require(winner[raffleId] == address(0), "Raffle already has a winner");

        raffle.active = false;
        uint256 amount = raffle.balance;
        raffle.balance = 0;
        if (amount > 0) {
            (bool ok, ) = payable(raffle.creator).call{value: amount}("");
            require(ok, "Refund failed");
        }

        emit RaffleClosed(raffleId);
    }

    receive() external payable {
        revert("use createRaffle/deposit with raffleId");
    }
}
