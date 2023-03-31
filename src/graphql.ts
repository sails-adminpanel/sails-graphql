import * as helper from "../lib/graphqlHelper";

import { ApolloServer } from "apollo-server-express";
const fs = require("fs");
const path = require("path");

import { PubSub } from "apollo-server";
const pubsub = new PubSub();
sails.graphql = { pubsub };
let server: ApolloServer;

const AdditionalResolvers: any = {};

export default {
  getPubsub: () => pubsub,
  getServer: () => server,
  addAdditionalResolver: (resolver) => {
    _.merge(AdditionalResolvers, resolver);
  },
  init: async function () {
    let resolversApiPath = path.resolve(__dirname, "./resolvers");
    if (fs.existsSync(resolversApiPath)) {
      helper.addDirResolvers(resolversApiPath);
    }
    resolversApiPath = path.resolve(process.cwd(), "./api/resolvers");
    if (fs.existsSync(resolversApiPath)) {
      helper.addDirResolvers(resolversApiPath);
    }

    helper.addAllSailsModels();

    if (sails.config.graphql?.whiteListAutoGen)
      helper.setWhiteList(sails.config.graphql.whiteListAutoGen);

    if (sails.config.graphql?.blackList)
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

    let apolloServer: ApolloServer;
    try {
      apolloServer = new ApolloServer({
        typeDefs,
        resolvers: [resolvers, AdditionalResolvers],
        subscriptions: {
          onConnect: (connectionParams, webSocket) => {
            let exContext = {};
            if (connectionParams) {
              if (
                !connectionParams["authorization"] &&
                connectionParams["Authorization"]
              )
                connectionParams["authorization"] =
                  connectionParams["Authorization"];

              exContext["connectionParams"] = connectionParams;
            }
            exContext["pubsub"] = pubsub;
            return exContext;
          },
        },
        context: async ({ req, connection }) => {
          if (connection) {
            return connection.context;
          } else {
            return { ...req };
          }
        },
      });
    } catch (error) {
      if (error.locations && error.locations[0].line) {
        typeDefs.split("\n").forEach((item, i) => {
          if(Math.abs(error.locations[0].line - i) < 10 ){
            console.log(i, `|`, item);
            if(error.locations[0].line - 1 === i){
              console.log('_______________');
            }
          }
        });
        console.log(
          `ERROR LINE: ${error.locations[0].line} `,
          typeDefs.split("\n", -1)[error.locations[0].line - 1]
        );
      }

      console.error(JSON.stringify(error));
      throw error;
    }
    server = apolloServer;
    return apolloServer;
  },
};
