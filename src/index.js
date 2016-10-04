import Redink from './Redink';

function singleton() {
  if (singleton.instance) {
    return {
      instance() {
        return singleton.instance;
      },
    };
  }

  return {
    connect(options) {
      singleton.instance = new Redink(options);
      return singleton.instance.connect();
    },

    instance() {
      throw new Error(
        'Tried invoking Redink\'s singleton instance without first starting it. This could be ' +
        'because you tried importing `model` or `registerSchemas` from Redink without creating a ' +
        'connection. Please try running redink().connect() before invoking any of Redink\'s ' +
        'methods.'
      );
    },
  };
}

export const model = (...args) => singleton().instance().model(...args);
export const disconnect = (...args) => singleton().instance().disconnect(...args);

export default singleton;
