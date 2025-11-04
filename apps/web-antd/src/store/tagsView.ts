import type { RouteLocationNormalizedLoaded } from 'vue-router';

import { useRouter } from 'vue-router';

import { findIndex } from 'lodash';
import { defineStore } from 'pinia';

import { getRawRoute } from '../utils/routerHelper';

const router = useRouter();

export interface TagsViewState {
  visitedViews: RouteLocationNormalizedLoaded[];
  cachedViews: Set<string>;
}

export const useTagsViewStore = defineStore('tagsView', {
  state: (): TagsViewState => ({
    visitedViews: [],
    cachedViews: new Set(),
  }),

  getters: {
    getVisitedViews(): RouteLocationNormalizedLoaded[] {
      return this.visitedViews;
    },
    getCachedViews(): string[] {
      return [...this.cachedViews];
    },
  },

  actions: {
    /** 新增缓存和tag */
    addView(view: RouteLocationNormalizedLoaded): void {
      this.addVisitedView(view);
      this.addCachedView();
    },

    /** 新增tag */
    addVisitedView(view: RouteLocationNormalizedLoaded) {
      if (this.visitedViews.some((v) => v.fullPath === view.fullPath)) return;
      if (view.meta?.noTagsView) return;

      const visitedView = Object.assign({}, view, {
        title: view.meta?.title || 'no-name',
      });

      if (visitedView.meta) {
        const suffixList: string[] = [];
        this.visitedViews.forEach((v) => {
          if (
            v.path === visitedView.path &&
            v.meta?.title === visitedView.meta?.title
          ) {
            const rawSuffix = v.meta?.titleSuffix;
            const suffixStr =
              typeof rawSuffix === 'string' || typeof rawSuffix === 'number'
                ? `${rawSuffix}`
                : undefined;
            suffixList.push(suffixStr ?? '1');
          }
        });
        if (suffixList.length > 0) {
          let suffix = 1;
          while (suffixList.includes(`${suffix}`)) suffix += 1;
          visitedView.meta.titleSuffix = suffix === 1 ? undefined : `${suffix}`;
        }
      }

      this.visitedViews.push(visitedView);
    },

    /** 新增缓存 */
    addCachedView() {
      const cacheMap: Set<string> = new Set();
      for (const v of this.visitedViews) {
        const item = getRawRoute(v);
        if (!item.meta?.noCache) {
          const name = item.name as string;
          cacheMap.add(name);
        }
      }
      if (
        [...this.cachedViews].sort().toString() ===
        [...cacheMap].sort().toString()
      ) {
        return;
      }
      this.cachedViews = cacheMap;
    },

    /** 删除某个tag和缓存 */
    delView(view: RouteLocationNormalizedLoaded) {
      this.delVisitedView(view);
      this.delCachedView();
    },

    /** 删除tag */
    delVisitedView(view: RouteLocationNormalizedLoaded) {
      const index = findIndex<RouteLocationNormalizedLoaded>(
        this.visitedViews,
        (v) => v.fullPath === view.fullPath,
      );
      if (index > -1) this.visitedViews.splice(index, 1);
    },

    /** 删除缓存 */
    delCachedView() {
      const route = router.currentRoute.value;
      const index = findIndex<string>(
        this.getCachedViews,
        (v) => v === route.name,
      );
      if (index > -1) {
        const name = this.getCachedViews[index] as string;
        this.cachedViews.delete(name);
      }
    },

    /** 删除全部tag和缓存 */
    delAllViews() {
      this.visitedViews = [];
      this.cachedViews.clear();
    },

    /** 删除其他tag和缓存 */
    delOthersViews(view: RouteLocationNormalizedLoaded) {
      this.visitedViews = this.visitedViews.filter(
        (v) => v?.meta?.affix || v.fullPath === view.fullPath,
      );
      this.addCachedView();
    },

    /** 删除左侧tag */
    delLeftViews(view: RouteLocationNormalizedLoaded) {
      const index = findIndex<RouteLocationNormalizedLoaded>(
        this.visitedViews,
        (v) => v.fullPath === view.fullPath,
      );
      if (index > -1) {
        this.visitedViews = this.visitedViews.filter(
          (v, i) => v?.meta?.affix || v.fullPath === view.fullPath || i > index,
        );
        this.addCachedView();
      }
    },

    /** 删除右侧tag */
    delRightViews(view: RouteLocationNormalizedLoaded) {
      const index = findIndex<RouteLocationNormalizedLoaded>(
        this.visitedViews,
        (v) => v.fullPath === view.fullPath,
      );
      if (index > -1) {
        this.visitedViews = this.visitedViews.filter(
          (v, i) => v?.meta?.affix || v.fullPath === view.fullPath || i < index,
        );
        this.addCachedView();
      }
    },

    /** 更新tag */
    updateVisitedView(view: RouteLocationNormalizedLoaded) {
      const index = findIndex<RouteLocationNormalizedLoaded>(
        this.visitedViews,
        (v) => v.fullPath === view.fullPath,
      );
      if (index > -1) {
        this.visitedViews[index] = {
          ...this.visitedViews[index],
          ...view,
        } as RouteLocationNormalizedLoaded;
      }
    },
  },
});
