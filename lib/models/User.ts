export interface Role {
  admin: boolean;
  streamer: boolean;
  viewer: boolean;
}

export interface User {
  id?: string;
  email: string;
  username: string;
  password?: string; // Only used for registration/login, not stored in response objects
  createdAt: string;
  age?: number;
  city?: string;
  country?: string;
  phone?: string;
  role: Role;
  isAdmin: boolean;
}
export interface UserCreateDTO {
  email: string;
  username: string;
  password: string;
  age?: number;
  city?: string;
  country?: string;
  phone?: string;
  role?: Partial<Role>;
}

export interface UserLoginDTO {
  email: string;
  password: string;
}

export interface UserResponseDTO {
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
  token?: string; // JWT token
}
