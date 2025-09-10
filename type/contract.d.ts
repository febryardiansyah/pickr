enum RaffleStatus {
  ACTIVE,
  INACTIVE,
  STARTED,
}

type TRaffle = {
  creator: string;
  balance: bigint;
  status: RaffleStatus;
  maxParticipant: bigint;
  minParticipant: bigint;
  totalParticipant: bigint;
};
