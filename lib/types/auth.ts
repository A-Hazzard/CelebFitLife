export type LoginResult = {
    success: boolean;
    error?: string;
}

export type RegistrationData = {
    username: string;
    email: string;
    password: string;
    phone: string;
    country: string;
    city: string;
    age: number;
    acceptedTnC: boolean;
}