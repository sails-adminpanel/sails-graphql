/**
 * Добавляет модель в список моделей для создания типов схемы graphql
 *
 *
 * @param modelName string
 * @returns void
 */
declare function addModel(modelName: string): void;
declare function addType(type: string): void;
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
declare function addResolvers(resolvers: Object): void;
/**
 * Сканирует все модели sails и добавляет их в список моделей для создания типов схемы graphql
 */
declare function addAllSailsModels(): void;
/**
 * Добавляет массив с исключениями к текущему списку
 * Варианты:
 * 1. ["Order.field"] - исключает поле field в модели Order
 * 2. ["Order"] - исключает модель Order полностью
 * 3. ["field] - исключает поле field из всех моделей
 *
 * @param list array<string>
 */
declare function addToBlackList(list: Array<string>): void;
/**
 * Добавляет в указаную модель новое поле
 * Пример: addCustomField("Order", "customField: string")
 *
 * @param model string
 * @param field string
 */
declare function addCustomField(model: any, field: any): void;
/**
 * Добавляет в список автозамены поле.
 * Пример: addToReplaceList("Dish.image", "image: [Image]");
 *
 * @param model string
 * @param field string
 */
declare function addToReplaceList(model: any, field: any): void;
/**
 * Сканирует указанную директорию и добавляет найденные резолверсы в схему graphql
 *
 * @param dir
 */
declare function addDirResolvers(dir: any): void;
/**
 * Запускает генерацию схемы и резолверсов
 * Возвращает готовые данные для использования при инициализации apollo server
 *
 * @returns {schemaTypes, schemaResolvers}
 */
declare function getSchema(): {
    typeDefs: string;
    resolvers: Resolvers;
};
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
declare function setWhiteList(list: Object): void;
/**
 * Генерирует резолвер для модели. Учитывает список исключений и whiteList
 *
 * @param modelname string
 * @returns void
 */
declare function addModelResolver(modelname: any): void;
declare const _default: {
    addModel: typeof addModel;
    addType: typeof addType;
    addResolvers: typeof addResolvers;
    getSchema: typeof getSchema;
    addToBlackList: typeof addToBlackList;
    addCustomField: typeof addCustomField;
    addToReplaceList: typeof addToReplaceList;
    addAllSailsModels: typeof addAllSailsModels;
    addDirResolvers: typeof addDirResolvers;
    addModelResolver: typeof addModelResolver;
    setWhiteList: typeof setWhiteList;
};
export default _default;
export { addModel, addType, addResolvers, getSchema, addToBlackList, addCustomField, addToReplaceList, addAllSailsModels, addDirResolvers, addModelResolver, setWhiteList };
interface Resolvers {
    Query?: Resolver;
    Mutation?: Resolver;
    Subscription?: Resolver;
}
interface Resolver {
    [name: string]: {
        def?: string;
        fn?: Object;
        subscribe?: Object;
        resolve?: Object;
        [x: string]: Object;
    };
}
