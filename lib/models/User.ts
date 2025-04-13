export type Role = {
  admin: boolean;
  streamer: boolean;
  viewer: boolean;
};

export type User = {
  id?: string;
  email: string;
  username: string;
  password?: string;
  createdAt: string;
  age?: number;
  city?: string;
  country?: string;
  phone?: string;
  role: Role;
  isAdmin: boolean;
};

export type UserCreateDTO = {
  email: string;
  username: string;
  password: string;
  age?: number;
  city?: string;
  country?: string;
  phone?: string;
  role?: Partial<Role>;
};

export type UserLoginDTO = {
  email: string;
  password: string;
};

export type UserResponseDTO = {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  age?: number;
  city?: string;
  country?: string;
  phone?: string;
  role: Role;
  isAdmin: boolean;
  token?: string;
};
