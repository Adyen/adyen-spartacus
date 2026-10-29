import {RoutingConfig} from '@spartacus/core';

/**
 * Semantic route of the My Subscriptions page. The page itself is a CMS content page (label `/my-account/subscriptions`,
 * see the connector's spartacus cms-content.impex), so this only lets links resolve the path; merchants can override it
 * with `provideConfig({routing: {routes: {mySubscriptions: {paths: [...]}}}})`.
 */
export const adyenSubscriptionsRoutingConfig: RoutingConfig = {
  routing: {
    routes: {
      mySubscriptions: {paths: ['my-account/subscriptions']},
    },
  },
};
