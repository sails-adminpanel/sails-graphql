"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTAuth = void 0;
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
process.env.JWT_SECRET = (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : getRandom();
class JWTAuth {
    static sign(authData) {
        jwt.sign({
            data: authData
        }, process.env.JWT_SECRET, { expiresIn: 60 * 60 });
        return "";
    }
    static async verify(token) {
        return jwt.verify(token, process.env.JWT_SECRET);
    }
}
exports.JWTAuth = JWTAuth;
function getRandom(length = 16) {
    return crypto.randomBytes(length).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
