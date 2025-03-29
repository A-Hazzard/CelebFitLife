export interface Message {
  id?: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  streamId: string;
  isSystem?: boolean;
}

export interface MessageCreateDTO {
  content: string;
  senderId: string;
  senderName: string;
  streamId: string;
  isSystem?: boolean;
}
