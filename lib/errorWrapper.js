"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Error = void 0;
const apollo_server_errors_1 = require("apollo-server-errors");
class Error extends apollo_server_errors_1.ApolloError {
    constructor(code, message) {
        super(message, code);
        Object.defineProperty(this, 'name', { value: 'MyError' });
    }
}
exports.Error = Error;
