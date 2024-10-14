"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ToInitialize;
const afterHook_1 = require("./afterHook");
function ToInitialize(sails) {
    return function initialize(cb) {
        sails.on('lifted', () => {
            (0, afterHook_1.default)();
        });
        return cb();
    };
}
