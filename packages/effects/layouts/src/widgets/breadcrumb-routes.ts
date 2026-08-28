import type { RouteLocationNormalizedLoaded } from 'vue-router';

type MatchedRoutes = RouteLocationNormalizedLoaded['matched'];

interface BreadcrumbRoute {
  matched: MatchedRoutes;
  meta: RouteLocationNormalizedLoaded['meta'];
}

type BreadcrumbRouteResolver = (path: string) => { matched: MatchedRoutes };

/**
 * 使用 activePath 对应的路由层级补齐当前路由的面包屑。
 */
export function resolveBreadcrumbMatches(
  route: BreadcrumbRoute,
  resolveRoute: BreadcrumbRouteResolver,
): MatchedRoutes {
  const { activePath, breadcrumbUseActivePath } = route.meta;

  if (!breadcrumbUseActivePath || !activePath) {
    return route.matched;
  }

  const activeMatches = resolveRoute(activePath).matched;
  if (activeMatches.length === 0) {
    return route.matched;
  }

  const seen = new Set(activeMatches.map((match) => match.name ?? match.path));
  const currentMatches = route.matched.filter((match) => {
    const key = match.name ?? match.path;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return [...activeMatches, ...currentMatches];
}
