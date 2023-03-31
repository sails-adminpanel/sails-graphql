import { ApolloError } from 'apollo-server-errors';

export class Error extends ApolloError {
    constructor(code: string, message: string) {
      super(message, code);
  
      Object.defineProperty(this, 'name', { value: 'MyError' });
    }
  }
