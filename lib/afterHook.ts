import graphql from "../src/graphql";
export default async function () {
  try {
    const graphServer = await graphql.init();
    sails.hooks.http.app.use(graphServer.getMiddleware());
    let layer = sails.hooks.http.app._router.stack.slice(-1)[0] 
    sails.hooks.http.app._router.stack.splice(1, 0, layer)
    graphServer.installSubscriptionHandlers(sails.hooks.http.server);
  } catch (e) {
    sails.log.error("graphql > afterHook > error1", e, e.locations);
    process.exit(1);
  }
}
