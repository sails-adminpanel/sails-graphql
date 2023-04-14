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
const helper = require("../lib/graphqlHelper");
const apollo_server_express_1 = require("apollo-server-express");
const fs = require("fs");
const path = require("path");
const apollo_server_1 = require("apollo-server");
const pubsub = new apollo_server_1.PubSub();
sails.graphql = { pubsub };
let server;
const AdditionalResolvers = {};
exports.default = {
    getPubsub: () => pubsub,
    getServer: () => server,
    addAdditionalResolver: (resolver) => {
        _.merge(AdditionalResolvers, resolver);
    },
    init: function () {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let resolversApiPath = path.resolve(__dirname, "./resolvers");
            if (fs.existsSync(resolversApiPath)) {
                helper.addDirResolvers(resolversApiPath);
            }
            resolversApiPath = path.resolve(process.cwd(), "./api/resolvers");
            if (fs.existsSync(resolversApiPath)) {
                helper.addDirResolvers(resolversApiPath);
            }
            helper.addAllSailsModels();
            if ((_a = sails.config.graphql) === null || _a === void 0 ? void 0 : _a.whiteListAutoGen)
                helper.setWhiteList(sails.config.graphql.whiteListAutoGen);
            if ((_b = sails.config.graphql) === null || _b === void 0 ? void 0 : _b.blackList)
                helper.addToBlackList(sails.config.graphql.blackList);
            helper.addToBlackList(["createdAt", "updatedAt"]);
            // required root types for moduling schema
            helper.addType(`#graphql
      type Query {
        _root: String
      }
      type Mutation {
        _root: String
      }
      type Subscription {
        _root: String
      }`);
            const { typeDefs, resolvers } = helper.getSchema();
            let apolloServer;
            try {
                apolloServer = new apollo_server_express_1.ApolloServer({
                    typeDefs,
                    resolvers: [resolvers, AdditionalResolvers],
                    subscriptions: {
                        onConnect: (connectionParams, webSocket) => {
                            let exContext = {};
                            if (connectionParams) {
                                if (!connectionParams["authorization"] &&
                                    connectionParams["Authorization"])
                                    connectionParams["authorization"] =
                                        connectionParams["Authorization"];
                                exContext["connectionParams"] = connectionParams;
                            }
                            exContext["pubsub"] = pubsub;
                            return exContext;
                        },
                    },
                    context: ({ req, connection }) => __awaiter(this, void 0, void 0, function* () {
                        if (connection) {
                            return connection.context;
                        }
                        else {
                            return Object.assign({}, req);
                        }
                    }),
                });
            }
            catch (error) {
                if (error.locations && error.locations[0].line) {
                    typeDefs.split("\n").forEach((item, i) => {
                        if (Math.abs(error.locations[0].line - i) < 10) {
                            console.log(i, `|`, item);
                            if (error.locations[0].line - 1 === i) {
                                console.log('_______________');
                            }
                        }
                    });
                    console.log(`ERROR LINE: ${error.locations[0].line} `, typeDefs.split("\n", -1)[error.locations[0].line - 1]);
                }
                console.error(JSON.stringify(error));
                throw error;
            }
            server = apolloServer;
            return apolloServer;
        });
    },
};
