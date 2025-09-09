// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OnchainRaffle {
    constructor() {
        owner = msg.sender;
    }

    modifier onlyCreator(uint256 raffleId) {
        require(_isRaffleExist(raffleId), "Raffle does not exist");
        require(raffles[raffleId].creator == msg.sender, "Not authorized");
        _;
    }

    enum RaffleStatus {
        ACTIVE,
        INACTIVE,
        STARTED
    }

    // models
    struct Raffle {
        address creator;
        uint256 balance;
        RaffleStatus status;
        uint256 maxParticipant;
        uint256 minParticipant;
        uint256 totalParticipant;
    }

    uint256 public nextRaffleId;
    address public owner;

    mapping(uint256 => Raffle) public raffles;
    mapping(uint256 => mapping(address => bool)) private hasJoined;
    mapping(uint256 => address[]) private participants;
    mapping(uint256 => address) public winners;

    // events
    event RaffleCreated(
        uint256 indexed id,
        address indexed creator,
        uint256 initialDeposit
    );
    event RaffleStarted(uint256 indexed id);
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

    // main functions
    function createRaffle(uint256 maxParticipant, uint256 minParticipant)
        external
        payable
        returns (uint256)
    {
        require(msg.value > 0, "Initial deposit is required");
        require(
            maxParticipant > minParticipant,
            "Max participant must be greater than min participant"
        );
        require(minParticipant > 0, "Min participant must be greater than 0");

        raffles[nextRaffleId] = Raffle(
            msg.sender,
            msg.value,
            RaffleStatus.ACTIVE,
            maxParticipant,
            minParticipant,
            0
        );

        emit RaffleCreated(nextRaffleId, msg.sender, msg.value);
        return nextRaffleId++;
    }

    function deposit(uint256 raffleId) external payable {
        require(_isRaffleExist(raffleId), "Raffle does not exist");
        Raffle storage raffle = raffles[raffleId];
        require(
            raffle.status == RaffleStatus.ACTIVE,
            "Raffle is already inactive or started"
        );
        require(msg.value > 0, "Deposit must be greater than 0");

        raffle.balance += msg.value;

        emit Deposited(raffleId, msg.sender, msg.value);
    }

    function startRaffle(uint256 raffleId) external onlyCreator(raffleId) {
        Raffle storage raffle = raffles[raffleId];
        require(
            raffle.status == RaffleStatus.ACTIVE,
            "Raffle is already inactive or started"
        );
        require(
            raffle.totalParticipant >= raffle.minParticipant,
            "Not enough participants"
        );

        raffle.status = RaffleStatus.STARTED;

        emit RaffleStarted(raffleId);
    }

    function winnerSelected(uint256 raffleId, address winner)
        external
        onlyCreator(raffleId)
    {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.status == RaffleStatus.STARTED, "Raffle is not started");
        require(winner != address(0), "Invalid winner");
        require(hasJoined[raffleId][winner], "Winner not a participant");

        uint256 prize = raffle.balance;
        require(prize > 0, "No prize balance");

        winners[raffleId] = winner;
        raffle.status = RaffleStatus.INACTIVE;
        raffle.balance = 0;

        (bool ok, ) = payable(winner).call{value: prize}("");
        require(ok, "Winner payout failure");

        emit WinnerSelected(raffleId, winner, prize);
    }

    function raffleParticipants(uint256 raffleId)
        external
        view
        returns (address[] memory)
    {
        return participants[raffleId];
    }

    function joinRaffle(uint256 raffleId) external {
        require(_isRaffleExist(raffleId), "Raffle does not exist");
        Raffle storage raffle = raffles[raffleId];
        require(
            raffle.creator != msg.sender,
            "You can't join to your own raffle"
        );
        require(
            raffle.status == RaffleStatus.ACTIVE,
            "Raffle is already inactive or started"
        );
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
        require(_isRaffleExist(raffleId), "Raffle does not exist");
        Raffle storage raffle = raffles[raffleId];
        require(
            raffle.status == RaffleStatus.ACTIVE,
            "Raffle is already inactive or started"
        );
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

    function closeRaffle(uint256 raffleId) external onlyCreator(raffleId) {
        Raffle storage raffle = raffles[raffleId];
        require(
            raffle.status == RaffleStatus.ACTIVE,
            "Raffle can only be closed before start"
        );

        uint256 refund = raffle.balance;
        raffle.balance = 0;
        raffle.status = RaffleStatus.INACTIVE;

        if (refund > 0) {
            (bool ok, ) = payable(raffle.creator).call{value: refund}("");
            require(ok, "Refund failure");
        }

        emit RaffleClosed(raffleId);
    }

    function _isRaffleExist(uint256 raffleId) private view returns (bool) {
        return raffles[raffleId].creator != address(0);
    }

    receive() external payable {
        revert("use createRaffle/deposit with raffleId");
    }
}
