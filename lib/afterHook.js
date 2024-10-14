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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const graphql_1 = require("../src/graphql");
function default_1() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const graphServer = yield graphql_1.default.init();
            sails.hooks.http.app.use(graphServer.getMiddleware());
            let layer = sails.hooks.http.app._router.stack.slice(-1)[0];
            sails.hooks.http.app._router.stack.splice(1, 0, layer);
            graphServer.installSubscriptionHandlers(sails.hooks.http.server);
        }
        catch (e) {
            sails.log.error("graphql > afterHook > error1", e, e.locations);
            process.exit(1);
        }
    });
}
