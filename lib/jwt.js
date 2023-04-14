"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    static verify(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return jwt.verify(token, process.env.JWT_SECRET);
        });
    }
}
exports.JWTAuth = JWTAuth;
function getRandom(length = 16) {
    return crypto.randomBytes(length).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
