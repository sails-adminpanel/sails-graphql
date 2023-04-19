import _ = require("lodash");
import *  as WLCriteria from 'waterline-criteria';
import { JWTAuth } from "./jwt";

import * as fs  from 'fs';
import * as path from 'path';

 const scalarTypes = {
    string: "String",
    number: "Float",
    boolean: "Boolean",
    // json: "Json",
    // "array": "Array",
}

const schemaResolvers = {};
const schemaTypes = [];
const schemaUnions = {};
const schemaScalars: Set<string> = new Set();
const blackList = [];
const customFields = {};
const replaceList = {};

const models: Set<string> = new Set();

/**
 * Добавляет модель в список моделей для создания типов схемы graphql
 *
 *
 * @param modelName string
 * @returns void
 */

function addModel (modelName: string) {
    modelName = firstLetterToUpperCase(modelName);
    if (blackList.includes(modelName)) {
        // schemaScalars.add(modelName);
        return;
    }
    models.add(modelName.toLowerCase());
}
function addType (type: string) {
    schemaTypes.push(type);
}
/**
 * Мержит новый резолвер с объектом резолверов. Новый резолвер заменит старый при совпадении имен
 *
 * @param resolvers
 * resolverExample = {
 *      def: "user(id: string)",
 *      fn: function (parent, args, context) {
 *          return User.find({id: args.id})
 *      }
 * }
 */
function addResolvers (resolvers: Object) {
    _.merge(schemaResolvers, resolvers);
}

/**
 * Сканирует все модели sails и добавляет их в список моделей для создания типов схемы graphql
 */
function addAllSailsModels() {
  Object.keys(sails.models).forEach((key) => {
    if (key.includes("__")) return;
    addModel(key);
  });
}

/**
 * Добавляет массив с исключениями к текущему списку
 * Варианты:
 * 1. ["Order.field"] - исключает поле field в модели Order
 * 2. ["Order"] - исключает модель Order полностью
 * 3. ["field] - исключает поле field из всех моделей
 *
 * @param list array<string>
 */
function addToBlackList(list: Array<string>) {
    blackList.push(...list);
}

/**
 * Добавляет в указаную модель новое поле
 * Пример: addCustomField("Order", "customField: string")
 *
 * @param model string
 * @param field string
 */
function addCustomField(model, field) {
  customFields[model] = customFields[model] === undefined ? "" : customFields[model]
  customFields[model] += `${field}\n`;
}

/**
 * Добавляет в список автозамены поле.
 * Пример: addToReplaceList("Dish.image", "image: [Image]");
 *
 * @param model string
 * @param field string
 */
function addToReplaceList(model, field) {
    replaceList[model] = field;
}

/**
 * Сканирует указанную директорию и добавляет найденные резолверсы в схему graphql
 *
 * @param dir
 */
function addDirResolvers(dir) {
  let files = fs.readdirSync(dir);
  for (let file of files) {
    if (file.substr(-3) == ".js") {
      const resolver = require(path.join(dir, file)).default;
      if (resolver) {
        addResolvers(resolver);
      }
    }
  }
}

/**
 * Запускает генерацию схемы и резолверсов
 * Возвращает готовые данные для использования при инициализации apollo server
 *
 * @returns {schemaTypes, schemaResolvers}
 */
function getSchema () {
  Object.keys(whiteList).forEach(modelname => {
    addModelResolver(modelname);
  });

  addResolvers(modelsResolvers);
  return createSchema({types: schemaTypes, resolvers: schemaResolvers});
}

function firstLetterToUpperCase(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
function firstLetterToLowerCase(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

/**
 * Перебирает все поля модели и генерирует тип для схемы graphql
 *
 * @param model sails.model
 * @returns string
 */
function createType(model) {
  const modelName = model.globalId;
  const attributes = model._attributes || model.attributes;
  let type = 'type ' + modelName + '{\n';
  for (let prop in attributes) {
    if (blackList.includes(`${modelName}.${prop}`) || blackList.includes(prop))
      continue;
    if (replaceList[`${modelName}.${prop}`] || replaceList[prop]) {
      const newField = replaceList[`${modelName}.${prop}`] || replaceList[prop];
      type += `  ${newField}\n`;
      continue;
    }

    let scalarType;
    if (attributes[prop].type) {
      if (scalarTypes[attributes[prop].type.toLowerCase()]) {
        scalarType = scalarTypes[attributes[prop].type.toLowerCase()];
      } else {
        scalarType = firstLetterToUpperCase(attributes[prop].type);
        schemaScalars.add(scalarType);
      }
      type += '  ' + prop + ': ' + scalarType + '\n';
    }

    // MODEL SCHEMA GENERATION
    if (attributes[prop].model) {
      let relationModel = sails.models[attributes[prop].model.toLowerCase()]
      scalarType = scalarTypes[relationModel.attributes[relationModel.primaryKey].type.toLowerCase()]
      const name = sails.models[attributes[prop].model.toLowerCase()].globalId;
      type += `  ${prop}: ${name}\n`;

      // Virtual Id field
      type += `  ${prop}Id: ${scalarType}\n`;

    }

    // COLLECTION SCHEMA GENERATION
    if (attributes[prop].collection) {
      let collectionModel = sails.models[attributes[prop].collection.toLowerCase()];
      scalarType = scalarTypes[collectionModel.attributes[collectionModel.primaryKey].type.toLowerCase()];
      const name = sails.models[attributes[prop].collection.toLowerCase()].globalId;
      type += `  ${prop}: [${name}]\n`;
    }
  }
  if (customFields[modelName]) {
    type += `  ${customFields[modelName]}\n`;
  }

  type += '}\n';
  return type;
}

/**
 * Соеденяет резолверсы и типы. Отделяет от резолверсов описание запросов.
 * Возвращает готовую схему и резолверсы для использования в apollo server
 *
 * @param typeDefsObj
 * @returns
 */
function createSchema(typeDefsObj) {
  let schema = '';
  const resolvers: Resolvers = {};
  if (Array.isArray(typeDefsObj.types)) {
    schema += typeDefsObj.types.join('\n');
  }
  // add types from models
  for (let model of models) {
    schema += createType(sails.models[model]);
  }
  // add union
  for (let prop in schemaUnions) {
    schema += `scalar ${prop}\n`;
  }
  // add scalar
  for (let scalar of schemaScalars) {
    schema += `scalar ${scalar}\n`;
  }
  // add resolver and type definition
  if (typeDefsObj.resolvers) {
    Object.keys(typeDefsObj.resolvers).forEach(key => {
      resolvers[key] = {};
      const res = typeDefsObj.resolvers[key];

      if (['Query', 'Mutation', 'Subscription'].includes(key)) {
        let typeString = `extend type ${key}{\n`;
        for (let prop in res) {
          typeString += '  ' + res[prop].def + '\n';
          resolvers[key][prop] = res[prop].fn;
        }
        typeString += '}\n';
        schema += '\n' + typeString;
      } else {
        if (res.def) {
          schema += '\n' + res.def + '\n';
        }
        if (res.fn) {
          resolvers[key] = res.fn;
        } else {
          resolvers[key] = res;
        }
      }
    })
  }
  return { typeDefs: schema, resolvers };
}


// AUTOGENERATE RESOLVERS -----------------------------------------------

// генерация резолверсов по списку моделей. Список моделей автоматически добавляется в схему.
const whiteList = {
  // group: ['subscription', 'query'] // order - modelname , 'subscription' - resolver type
}

let modelsResolvers: {Query?: Object, Subscription?: Object} = { Query: {}};
import { withFilter } from "apollo-server";

/**
 * Патчит waterline criteria во время автогенерации
 *
 * @param modelname
 * @param criteria
 * @returns
 */
function sanitizeCriteria(modelname, criteria) {

  if (sails.models[modelname].attributes.enable){
    criteria.enable = true;
  }

  if (sails.models[modelname].attributes.isDeleted){
    criteria.isDeleted = false;
  }
  return criteria;
}

/**
 * Добавляет whiteList
 * Пример: setWhiteList({
    page: ['query'],
    promotion: ['query'],
    maintenance: ['query', 'subscription']
  })
 *
 * @param list
 */
function setWhiteList(list: Object) {
  _.merge(whiteList, list);
}

/**
 * Генерирует резолвер для модели. Учитывает список исключений и whiteList
 *
 * @param modelname string
 * @returns void
 */

function addModelResolver(modelname) {
  if (!sails.models[modelname]) return;
  let modelName = sails.models[modelname].globalId;
  if (!modelName) {
    sails.log.error('graphql >>> Wrong Model Name :' + modelname);
    return;
  }
  ////////////////////
  // ⭐️ Query resolver
  ////////////////////

  if (whiteList[modelname].includes('query') && !blackList.includes(`${modelName}`)) {
    models.add(modelname); // make schema Type for Model
    const methodName = firstLetterToLowerCase(modelName)
    let resolverQuery = {
      def: `""" [autogenerated] ${isAuthRequired(modelname) ? '\n[auth required]': ''}""" ${methodName}(criteria: Json, skip: Int, limit: Int, sort: String): [${modelName}]`,
      fn: async function (parent, args, context) {
        let criteria = args.criteria || {};
        criteria = sanitizeCriteria(modelname, criteria);

        let query: any;
        if (criteria.where === undefined) {
          query = { where: criteria}
        } else {
          query = criteria
        }

        // If model has User field need auth
        if (isAuthRequired(modelName)) {
          let auth = await JWTAuth.verify(
              context.connectionParams.authorization
          );
          if (auth.userId) {
            if (modelName.toLowerCase() === "user") {
              query.where.id = auth.userId
            } else {
              query.where.user = auth.userId
            }
          } else {
            throw 'Authorization failed'
          }
        }

        //sorting
        if (sails.models[modelname].attributes.order) {
          query.sort = 'order ASC'
        }

        let ORMRequest = sails.models[modelname].find(query);

        if (args.skip) {
          ORMRequest.skip(args.skip)
        }

        if (args.limit) {
          ORMRequest.limit(args.limit)
        }

        if (args.sort) {
          ORMRequest.sort(args.sort)
        } else {
          if (sails.models[modelname].attributes.order) {
            ORMRequest.sort('order ASC')
          }
        }


        console.log(">>>",  modelName, query, ORMRequest)
        let result = await ORMRequest;
        return result;
      },
    };
    modelsResolvers.Query[methodName] = resolverQuery;


    let resolverQueryCount = {
      def: `""" [autogenerated] ${isAuthRequired(modelname) ? '\n[auth required]': ''}""" ${methodName}Count(criteria: Json): Int`,
      fn: async function (parent, args, context) {
        let criteria = args.criteria || {};
        criteria = sanitizeCriteria(modelname, criteria);

        let query: any;
        if (criteria.where === undefined) {
          query = { where: criteria}
        } else {
          query = criteria
        }

        // If model has User field need auth
        if (isAuthRequired(modelName)) {
          let auth = await JWTAuth.verify(
              context.connectionParams.authorization
          );
          if (auth.userId) {
            if (modelName.toLowerCase() === "user") {
              query.where.id = auth.userId
            } else {
              query.where.user = auth.userId
            }
          } else {
            throw 'Authorization failed'
          }
        }

        let ORMRequest = sails.models[modelname].find(query);
        console.log(">>>",  modelName, query, ORMRequest)
        let result = await ORMRequest;
        return result.length;
      },
    };

    modelsResolvers.Query[`${methodName}Count`] = resolverQueryCount;

  }

    /////////////////////////////
    //  ⭐️ Models fields resolvers
    /////////////////////////////

    let resolvers = {};
    // iterate separate resolvers in model (type])
    Object.keys(sails.models[modelname].attributes).forEach((key) => {
      if (key.includes("__")) return;
      if (blackList.includes(`${modelName}.${key}`) || blackList.includes(`${key}`)) return;
      if (typeof sails.models[modelname].attributes[key] === 'function') return;

      let modelAttribute = sails.models[modelname].attributes[key];

      if (modelAttribute.collection || modelAttribute.model) {
        let modelRelationType = modelAttribute.collection
          ? "collection"
          : "model";

        let relationKey =
            modelAttribute.via !== undefined
            ? modelAttribute.via
            : "id";

        let criteria = {};
        criteria = sanitizeCriteria(modelAttribute[modelRelationType], criteria);

        switch (modelRelationType) {
          case "model":
            resolvers[key] = async (parent, args, context) => {
              criteria[relationKey] = parent[key];
              return await sails.models[modelAttribute[modelRelationType]].findOne(criteria);
            };

            // add virtual ids
            resolvers[`${key}Id`] = async (parent, args, context) => {
                return parent && parent[key];
            };

            return;
          case "collection":
            resolvers[key] = async (parent, args, context) => {


              let subquery: any = { where: criteria};
              //sorting
              if (sails.models[modelname].attributes.order) {
                subquery.sort = 'order ASC'
              }

              // TODO: resolve hardcoded ID primary key
              let result = (await sails.models[modelname].findOne({id: parent.id}).populate(key, subquery));
              result = result ? result[key] : null;


              return result;
            };

            return;
          default:
            // empty
            break;
        }
      }

      resolvers[key] = async (parent, args, context) => {
        return parent && parent[key];
      };
    });

    modelsResolvers[modelName] = resolvers;

  ///////////////////////////
  // ⭐️ Subscription resolver
  ///////////////////////////

  if (!blackList.includes(`${modelName}`) && whiteList[modelname].includes('subscription')) {
    models.add(modelname);
    const methodName = `${firstLetterToLowerCase(modelName)}`;
    let subscription = {
      def: `""" [autogenerated] ${isAuthRequired(modelname) ? '\n[auth required]': ''} """ ${methodName}(criteria: Json): ${modelName} `,
      fn: {
        subscribe: withFilter(
          (rootValue, args, context, info) =>
            context.pubsub.asyncIterator(modelName),
          async (payload, args, context, info) => {

            let criteria = args.criteria || {};
            criteria = sanitizeCriteria(modelname, criteria);

            let query: any;
            if (criteria.where === undefined) {
              query = { where: criteria}
            } else {
              query = criteria
            }

            // If model has User field need auth
            if (isAuthRequired(modelName)) {
              let auth = await JWTAuth.verify(
                  context.connectionParams.authorization
              );
              if (auth.userId) {
                if (modelName.toLowerCase() === "user") {
                  query.where.id = auth.userId
                } else {
                  query.where.user = auth.userId
                }
              } else {
                throw 'Authorization failed'
              }
            }

            return checkCriteria(payload, criteria)

            // Filter by waterline criteria
            function checkCriteria(payload: any, criteria: any): boolean{

              // For id's array
              if (Array.isArray(criteria) ||  typeof criteria === "string"){
                return (WLCriteria(payload, { where: { id: criteria }}).results).length > 0
              }

              // Where cause
              if ( typeof criteria === 'object' && !Array.isArray(criteria) && criteria !== null ) {
                return (WLCriteria(payload, { where: criteria }).results).length > 0
              }

              return false
            }

          }
        ),
        resolve: (payload) => {
          return payload;
        },
      },
    };
    // add publish in model
    modelPublishExtend(modelname);
    if (!modelsResolvers.Subscription) modelsResolvers.Subscription = {};
    modelsResolvers.Subscription[methodName] = subscription;
  }
}

/**
 * Внутренняя функция используется при автогенерации резолверов
 * Модифицирует модель. Добавляет рассылку сообщений при afterUpdate & afterCreate
 *
 * @param modelname
 */
function modelPublishExtend(modelname) {
  let modelName = sails.models[modelname].globalId;

  let afterCreate = sails.models[modelname].afterCreate;
  sails.models[modelname].afterCreate = async function (values, cb ) {
      await sails.models[modelname].publish(values.id);
      if (afterCreate) {
        afterCreate(values, cb);
      } else {
        cb();
      }
  };

  let afterUpdate = sails.models[modelname].afterUpdate;
  sails.models[modelname].afterUpdate = async function (values, cb ) {
      await sails.models[modelname].publish(values.id);
      if (afterUpdate) {
        afterUpdate(values, cb);
      } else {
        cb();
      }
  };

  let modelPublishExtendObj = {
    publish: async function (id) {
      let data = await sails.models[modelname].findOne(id);
      // `http-api:request-${modelAttribute.collection.toLowerCase()}model-list`,

      emitter.emit(`http-api:before-send-${modelname.toLowerCase()}`, data);
      sails.graphql.pubsub.publish(modelName, data);
    },
  };

  _.merge(sails.models[modelname], modelPublishExtendObj);
}

function isAuthRequired (modelname: string) :Boolean{
  modelname = modelname.toLowerCase();
  return sails.models[modelname].attributes.user !== undefined || modelname === 'user';
}

export default {
  addModel,
  addType,
  addResolvers,
  getSchema,

  addToBlackList,
  addCustomField,
  addToReplaceList,
  addAllSailsModels,
  addDirResolvers,

  addModelResolver,
  setWhiteList
}
export {
  addModel,
  addType,
  addResolvers,
  getSchema,

  addToBlackList,
  addCustomField,
  addToReplaceList,
  addAllSailsModels,
  addDirResolvers,

  addModelResolver,
  setWhiteList
}

interface Resolvers {
  Query?: Resolver,
  Mutation?: Resolver,
  Subscription?: Resolver
}
interface Resolver {
  [name: string]: {
    def?: string,
    fn?: Object,
    subscribe?: Object,
    resolve?: Object,
    [x: string]: Object
  }
}
