export enum RoomStatus {
  ACTIVE,
  INACTIVE,
  STARTED,
}

export type TRoom = {
  creator: `0x${string}`;
  balance: bigint;
  status: RoomStatus;
  maxParticipant: bigint;
  minParticipant: bigint;
  totalParticipant: bigint;
  createdAt?: bigint;
};

export type Participant = { id: string; name?: string; address: string };

export type RoomDoc = {
  title: string;
  totalReward: number;
  participants: Participant[];
  host?: { name?: string; address?: string };
};

export type TUserRoomItem = {
  accessMode: string;
  code: string;
  createdAt: Date | string;
  creator: string;
  initialDepositEth: string;
  maxParticipants: number;
  minParticipants: number;
  participants: Participant[];
  password: string;
  status: string;
  title: string;
  totalWinners: number;
};
