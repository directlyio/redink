import { App } from './components';
import { Api, Docs, Home } from './scenes';

const routes = {
  path: '/',
  component: App,
  indexRoute: {
    onEnter: (nextState, replace) => replace('/about'),
  },
  childRoutes: [{
    path: '/about',
    component: Home,
  }, {
    path: '/api',
    component: Api,
  }, {
    path: '/docs',
    component: Docs,
  }, {
    path: '/home',
    component: Home,
  }],
};

export default routes;
