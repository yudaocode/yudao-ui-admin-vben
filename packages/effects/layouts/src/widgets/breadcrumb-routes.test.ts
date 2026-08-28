import type { RouteLocationNormalizedLoaded } from 'vue-router';

import { describe, expect, it, vi } from 'vitest';

import { resolveBreadcrumbMatches } from './breadcrumb-routes';

type MatchedRoutes = RouteLocationNormalizedLoaded['matched'];
type RouteMatch = MatchedRoutes[number];

function createMatch(name: string, path: string): RouteMatch {
  return {
    meta: { title: name },
    name,
    path,
  } as RouteMatch;
}

describe('resolveBreadcrumbMatches', () => {
  it('keeps current matches when the route does not opt in', () => {
    const currentMatches = [createMatch('Detail', '/detail')];
    const resolveRoute = vi.fn();

    const result = resolveBreadcrumbMatches(
      {
        matched: currentMatches,
        meta: {
          activePath: '/list',
          title: 'Detail',
        },
      },
      resolveRoute,
    );

    expect(result).toBe(currentMatches);
    expect(resolveRoute).not.toHaveBeenCalled();
  });

  it('keeps current matches when activePath cannot be resolved', () => {
    const currentMatches = [createMatch('Detail', '/detail')];
    const resolveRoute = vi.fn(() => ({ matched: [] }));

    const result = resolveBreadcrumbMatches(
      {
        matched: currentMatches,
        meta: {
          activePath: '/missing',
          breadcrumbUseActivePath: true,
          title: 'Detail',
        },
      },
      resolveRoute,
    );

    expect(result).toBe(currentMatches);
    expect(resolveRoute).toHaveBeenCalledWith('/missing');
  });

  it('prepends activePath matches and removes duplicate ancestors', () => {
    const root = createMatch('Root', '/');
    const section = createMatch('Section', '/section');
    const list = createMatch('List', '/section/list');
    const detail = createMatch('Detail', '/detail/:id');
    const resolveRoute = vi.fn(() => ({
      matched: [root, section, list],
    }));

    const result = resolveBreadcrumbMatches(
      {
        matched: [root, detail],
        meta: {
          activePath: '/section/list',
          breadcrumbUseActivePath: true,
          title: 'Detail',
        },
      },
      resolveRoute,
    );

    expect(resolveRoute).toHaveBeenCalledOnce();
    expect(resolveRoute).toHaveBeenCalledWith('/section/list');
    expect(result).toEqual([root, section, list, detail]);
  });
});
