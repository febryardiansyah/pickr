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
    mapping(uint256 => address[]) public participants;
    mapping(uint256 => address) public winners;

    // event
    event RaffleCreated(
        uint256 indexed id,
        address indexed creator,
        uint256 initialDeposit
    );
    event WinnerSelected(
        uint256 indexed id,
        address indexed user,
        uint256 amount
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

    function startRaffle(uint256 raffleId, address user) external {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.active, "Raffle is already inactive");

        (bool ok, ) = payable(user).call{value: raffle.balance}("");
        require(ok, "Transfer failed");

        emit WinnerSelected(raffleId, user, raffle.balance);
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
        participants[raffleId].push(msg.sender);

        emit JoinRaffle(raffleId, msg.sender);
    }

    function leaveRaffle(uint256 raffleId) external {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.active, "Raffle is already inactive");
        bool joined = hasJoined[raffleId][msg.sender];
        require(joined, "You have not joined the raffle yet");

        raffle.totalParticipant--;
        hasJoined[raffleId][msg.sender] = false;

        uint256 length = participants[raffleId].length;
        for (uint256 i = 0; i < length; i++) {
            if (participants[raffleId][i] == msg.sender) {
                participants[raffleId][i] = participants[raffleId][length - 1];
                participants[raffleId].pop();
                break;
            }
        }

        emit LeaveRaffle(raffleId, msg.sender);
    }

    function claimReward(uint256 raffleId) external {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.active, "Raffle is already inactive");

        emit Claimed(raffleId, msg.sender, 0);
    }

    function closeRaffle(uint256 raffleId) external {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.creator == msg.sender, "You are not the host");

        raffle.active = false;

        emit RaffleClosed(raffleId);
    }

    receive() external payable {
        revert("use createRaffle/deposit with raffleId");
    }
}
