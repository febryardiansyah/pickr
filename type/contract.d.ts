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

export type TParticipant = { id: string; name?: string; address: string };

export type TUserRoomItem = {
  accessMode: string;
  code: string;
  createdAt: Date | string;
  creator: string;
  initialDepositEth: string;
  maxParticipants: number;
  minParticipants: number;
  participants: TParticipant[];
  password: string;
  status: string;
  title: string;
  totalWinners: number;
};
