export type UserData = {
  uid: string;
  email: string;
  username: string;
  phone: string;
  country: string;
  city: string;
  age: number;
  isStreamer?: boolean; // Optional field
  isAdmin?: boolean; // Optional field
  createdAt?: string; // Optional, if you store creation timestamp as ISO string
  // Add other fields as necessary
};
