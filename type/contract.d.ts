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
  code: string;
  creator: `0x${string}`;
  balance: bigint;
  status: RoomStatus; // 0 ACTIVE, 1 INACTIVE, 2 STARTED
  max: number;
  min: number;
  total: number;
  createdAt?: number;
};
