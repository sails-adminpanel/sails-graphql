import sails from "@42pub/typed-sails";
type sailsConfig = typeof sails.config;

declare global {
  export interface Sails extends sails.Sails {
    on: any
    emit: any
    router: any
    hooks: any
    models: any;
    config: _sailsConfig;
    log: any;
    after: any;
    graphql: any;
  }
  interface _sailsConfig extends sailsConfig {
    [key:string]: any | object;
  }
  export const sails: Sails;
  type ReqType = sails.Request;
  type ResType = sails.Response;
  type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];
}