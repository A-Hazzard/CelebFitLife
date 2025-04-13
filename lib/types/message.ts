// Message types

export type Message = {
  id?: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  streamId: string;
  isSystem?: boolean;
};

export type MessageCreateDTO = {
  content: string;
  senderId: string;
  senderName: string;
  streamId: string;
  isSystem?: boolean;
};
