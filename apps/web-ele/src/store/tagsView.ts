import type { RouteLocationNormalizedLoaded } from 'vue-router';

import { useUserStore } from '@vben/stores';

import { defineStore } from 'pinia';

import { router } from '#/router';
import { findIndex } from '#/utils';
import { getRawRoute } from '#/utils/routerHelper';

import { store } from './index';

const userStore = useUserStore();

export interface TagsViewState {
  visitedViews: RouteLocationNormalizedLoaded[];
  cachedViews: Set<string>;
  selectedTag?: RouteLocationNormalizedLoaded;
}

export const useTagsViewStore = defineStore('tagsView', {
  state: (): TagsViewState => ({
    visitedViews: [],
    cachedViews: new Set(),
    selectedTag: undefined,
  }),
  getters: {
    getVisitedViews(): RouteLocationNormalizedLoaded[] {
      return this.visitedViews;
    },
    getCachedViews(): string[] {
      return [...this.cachedViews];
    },
    getSelectedTag(): RouteLocationNormalizedLoaded | undefined {
      return this.selectedTag;
    },
  },
  actions: {
    // 新增缓存和tag
    addView(view: RouteLocationNormalizedLoaded): void {
      this.addVisitedView(view);
      this.addCachedView();
    },
    // 新增tag
    addVisitedView(view: RouteLocationNormalizedLoaded) {
      if (this.visitedViews.some((v) => v.fullPath === view.fullPath)) return;
      if (view.meta?.noTagsView) return;
      const visitedView = Object.assign({}, view, {
        title: view.meta?.title || 'no-name',
      });

      if (visitedView.meta) {
        const titleSuffixList: string[] = [];
        this.visitedViews.forEach((v) => {
          if (
            v.path === visitedView.path &&
            v.meta?.title === visitedView.meta?.title
          ) {
            titleSuffixList.push((v.meta?.titleSuffix as string) || '1');
          }
        });
        if (titleSuffixList.length > 0) {
          let titleSuffix = 1;
          while (titleSuffixList.includes(`${titleSuffix}`)) {
            titleSuffix += 1;
          }
          visitedView.meta.titleSuffix =
            titleSuffix === 1 ? undefined : `${titleSuffix}`;
        }
      }

      this.visitedViews.push(visitedView);
    },
    // 新增缓存
    addCachedView() {
      const cacheMap: Set<string> = new Set();
      for (const v of this.visitedViews) {
        const item = getRawRoute(v);
        const needCache = !item.meta?.noCache;
        if (!needCache) {
          continue;
        }
        const name = item.name as string;
        cacheMap.add(name);
      }
      if (
        [...this.cachedViews].sort().toString() ===
        [...cacheMap].sort().toString()
      )
        return;
      this.cachedViews = cacheMap;
    },
    // 删除某个
    delView(view: RouteLocationNormalizedLoaded) {
      this.delVisitedView(view);
      this.delCachedView();
    },
    // 删除tag
    delVisitedView(view: RouteLocationNormalizedLoaded) {
      for (const [i, v] of this.visitedViews.entries()) {
        if (v.fullPath === view.fullPath) {
          this.visitedViews.splice(i, 1);
          break;
        }
      }
    },
    // 删除缓存
    delCachedView() {
      const route = router.currentRoute.value;
      const index = findIndex<string>(
        this.getCachedViews,
        (v) => v === route.name,
      );
      for (const v of this.visitedViews) {
        if (v.name === route.name) {
          return;
        }
      }
      if (index > -1) {
        this.cachedViews.delete(
          this.getCachedViews[index] as unknown as string,
        );
      }
    },
    // 删除所有缓存和tag
    delAllViews() {
      this.delAllVisitedViews();
      this.delCachedView();
    },
    // 删除所有tag
    delAllVisitedViews() {
      // const userStore = useUserStoreWithOut();

      // const affixTags = this.visitedViews.filter((tag) => tag.meta.affix)
      this.visitedViews = userStore.userInfo
        ? this.visitedViews.filter((tag) => tag?.meta?.affix)
        : [];
    },
    // 删除其他
    delOthersViews(view: RouteLocationNormalizedLoaded) {
      this.delOthersVisitedViews(view);
      this.addCachedView();
    },
    // 删除其他tag
    delOthersVisitedViews(view: RouteLocationNormalizedLoaded) {
      this.visitedViews = this.visitedViews.filter((v) => {
        return v?.meta?.affix || v.fullPath === view.fullPath;
      });
    },
    // 删除左侧
    delLeftViews(view: RouteLocationNormalizedLoaded) {
      const index = findIndex<RouteLocationNormalizedLoaded>(
        this.visitedViews,
        (v) => v.fullPath === view.fullPath,
      );
      if (index > -1) {
        this.visitedViews = this.visitedViews.filter((v, i) => {
          return v?.meta?.affix || v.fullPath === view.fullPath || i > index;
        });
        this.addCachedView();
      }
    },
    // 删除右侧
    delRightViews(view: RouteLocationNormalizedLoaded) {
      const index = findIndex<RouteLocationNormalizedLoaded>(
        this.visitedViews,
        (v) => v.fullPath === view.fullPath,
      );
      if (index > -1) {
        this.visitedViews = this.visitedViews.filter((v, i) => {
          return v?.meta?.affix || v.fullPath === view.fullPath || i < index;
        });
        this.addCachedView();
      }
    },
    updateVisitedView(view: RouteLocationNormalizedLoaded) {
      for (let v of this.visitedViews) {
        if (v.fullPath === view.fullPath) {
          v = Object.assign(v, view);
          break;
        }
      }
    },
    // 设置当前选中的 tag
    setSelectedTag(tag: RouteLocationNormalizedLoaded) {
      this.selectedTag = tag;
    },
    setTitle(title: string, path?: string) {
      for (const v of this.visitedViews) {
        if (v.path === (path ?? this.selectedTag?.path)) {
          v.meta.title = title;
          break;
        }
      }
    },
  },
  persist: false,
});

export const useTagsViewStoreWithOut = () => {
  return useTagsViewStore(store);
};
