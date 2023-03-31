import { ApolloError } from 'apollo-server-errors';
export declare class Error extends ApolloError {
    constructor(code: string, message: string);
}
