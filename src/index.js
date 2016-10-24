import Redink from './Redink';
import Resource from './Resource';
import ResourceArray from './ResourceArray';

function singleton() {
  if (singleton.instance) {
    return {
      instance() {
        return singleton.instance;
      },

      disconnect() {
        return singleton.instance.disconnect();
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
export const disconnect = () => singleton().instance().disconnect();
export const isResource = (resource) => resource instanceof Resource;
export const isResourceArray = (resourceArray) => resourceArray instanceof ResourceArray;

export { singleton as redink };
export default singleton;
