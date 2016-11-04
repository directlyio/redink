import Redink from './Redink';
import Node from './Node';
import Connection from './Connection';

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
export const isNode = (resource) => resource instanceof Node;
export const isConnection = (resourceArray) => resourceArray instanceof Connection;

export { singleton as redink };
export default singleton;
