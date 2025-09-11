export enum RaffleStatus {
  ACTIVE,
  INACTIVE,
  STARTED,
}

export type TRaffle = {
  creator: `0x${string}`;
  balance: bigint;
  status: RaffleStatus;
  maxParticipant: bigint;
  minParticipant: bigint;
  totalParticipant: bigint;
  createdAt?: bigint;
};

export type Participant = { id: string; name?: string; address: string };

export type RaffleDoc = {
  title: string;
  totalReward: number;
  participants: Participant[];
  host?: { name?: string; address?: string };
};

export type TUserRaffleItem = {
  code: string;
  creator: `0x${string}`;
  balance: bigint;
  status: RaffleStatus; // 0 ACTIVE, 1 INACTIVE, 2 STARTED
  max: number;
  min: number;
  total: number;
  createdAt?: number;
};
