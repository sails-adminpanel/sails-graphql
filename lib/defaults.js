"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let userConfig = {};
if (process.env.USER_API != "NO") {
    // userConfig = {
    //   ...userConfig,
    //   user: ['query', 'subscription'],
    // }
    // if (process.env.USER_BONUS_API != "NO") {
    //   userConfig = {
    //     ...userConfig,
    //     userbonus: ['query', 'subscription']
    //   }
    // } 
    // if (process.env.USER_LOCATION_API != "NO") {
    //   userConfig = {
    //     ...userConfig,
    //     userlocation: ['query', 'subscription']
    //   }
    // }
}
module.exports.graphql = {
    whiteListAutoGen: {
    //    group: ['query', 'subscription'],
    //    dish: ['query', 'subscription'],
    //    ...userConfig
    },
    blackList: [
        'isDeleted',
        'passwordHash',
        'createdAt',
        'updatedAt'
    ]
};
