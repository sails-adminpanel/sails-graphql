declare type AuthData = {
    userId: string;
    deviceId: string;
    authToken: string;
};
export declare class JWTAuth {
    static sign(authData: AuthData): string;
    static verify(token: string): Promise<AuthData>;
}
export {};
