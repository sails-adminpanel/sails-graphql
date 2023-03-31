module.exports = function (sails) {
  return {
    defaults: require('./lib/defaults'),
    initialize: require('./lib/initialize').default(sails)
  };
};

export * from './lib/graphqlHelper';
export * from './lib/errorWrapper';