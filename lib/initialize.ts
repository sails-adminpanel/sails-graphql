import afterHook from "./afterHook";
export default function ToInitialize(sails) {
  return function initialize(cb) {

    sails.on('lifted', () => {
      afterHook();
    });
    return cb();
  };
}
