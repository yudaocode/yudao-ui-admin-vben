import type { EChartsOption } from 'echarts';

import type { Ref } from 'vue';

import type { Nullable } from '@vben/types';

import type EchartsUI from './echarts-ui.vue';

import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  unref,
  watch,
} from 'vue';

import { usePreferences } from '@vben/preferences';

import {
  tryOnUnmounted,
  useDebounceFn,
  useResizeObserver,
  useTimeoutFn,
  useWindowSize,
} from '@vueuse/core';

import echarts from './echarts';

type EchartsUIType = typeof EchartsUI | undefined;

type EchartsThemeType = 'dark' | 'light' | null;

// getOption 返回的 geo 配置项（已移除的内部组件为 null）
type GeoOptionItem = null | { map?: unknown };

// 中国地图数据及地图组件仅在图表用到地图时按需加载，所有图表共享同一次加载
let chinaMapPromise: null | Promise<unknown> = null;
let chinaMapLoaded = false; // 地图组件是否已注册

function isMapOptions(options: EChartsOption): boolean {
  // 兼容标准配置层级：顶层、baseOption、timeline 的 options、media[].option
  const layers: (EChartsOption | undefined)[] = [
    options,
    options.baseOption,
    ...(options.options ?? []),
    ...(options.media ?? []).map((item) => item.option as EChartsOption),
  ];
  return layers.some((layer) => {
    if (!layer) {
      return false;
    }
    if (layer.geo) {
      return true;
    }
    const series = layer.series;
    if (!series) {
      return false;
    }
    return (Array.isArray(series) ? series : [series]).some(
      (item) =>
        item?.type === 'map' ||
        (item as { coordinateSystem?: string })?.coordinateSystem === 'geo',
    );
  });
}

function loadChinaMap(options: EChartsOption): Promise<unknown> {
  if (!isMapOptions(options)) {
    return Promise.resolve();
  }
  if (!chinaMapPromise) {
    chinaMapPromise = import('./china-map').then(
      ({ registerChinaMap }) => {
        registerChinaMap();
        chinaMapLoaded = true;
      },
      (error) => {
        chinaMapPromise = null; // 加载失败时，允许下次渲染重新加载
        throw error;
      },
    );
  }
  return chinaMapPromise;
}

function useEcharts(chartRef: Ref<EchartsUIType>) {
  let chartInstance: echarts.ECharts | null = null;
  // 当前实例是否在地图注册之后创建
  let instanceMapReady = false;
  let cacheOptions: EChartsOption = {};
  // echarts是否处于激活状态
  const isActiveRef = ref(false);

  const { isDark } = usePreferences();
  const { height, width } = useWindowSize();
  const resizeHandler: () => void = useDebounceFn(resize, 200);
  // 等待地图加载期间被 keep-alive 切走，激活后需要补渲染
  let pendingRender = false;
  // 未激活期间推迟的 updateData，激活后重新渲染时按原参数补上
  let pendingUpdates: {
    lazyUpdate: boolean;
    notMerge: boolean;
    option: EChartsOption;
  }[] = [];
  // 渲染请求序号：整体渲染（renderEcharts、激活/主题重渲染）及 notMerge 的 updateData 以最后一次为准，
  // 等待地图或延时后发现已过期则不再渲染；合并的 updateData 不取代渲染，而是排在其后
  let renderId = 0;
  // 整体替换序号：仅 renderEcharts、notMerge 的 updateData 递增；连续的合并更新互不取代，按调用顺序依次生效
  let replaceId = 0;
  // 合并更新的排队：排在之前的合并更新及整体渲染完成之后
  let updateQueue: Promise<unknown> = Promise.resolve();
  let isUnmounted = false;
  const isStale = (id: number) => isUnmounted || id !== renderId;
  // 放弃渲染时的返回值：被新请求取代时返回当前实例，卸载或未激活时返回 null
  const getSkippedResult = (id: number) =>
    isStale(id) && !isUnmounted ? chartInstance : null;

  const getChartEl = (): HTMLElement | null => {
    const refValue = chartRef?.value as unknown;
    if (!refValue) return null;
    if (refValue instanceof HTMLElement) {
      return refValue;
    }
    const maybeComponent = refValue as { $el?: HTMLElement };
    return maybeComponent.$el ?? null;
  };

  onMounted(() => (isActiveRef.value = true));
  onActivated(() => (isActiveRef.value = true));
  onDeactivated(() => (isActiveRef.value = false));
  onBeforeUnmount(() => (isActiveRef.value = false));
  onActivated(() => {
    // 已有实例时，由下方 watch 在激活后重新渲染
    if (pendingRender && !chartInstance) {
      renderEcharts(cacheOptions);
    }
    pendingRender = false;
  });

  const isElHidden = (el: HTMLElement | null): boolean => {
    if (!el) return true;
    return el.offsetHeight === 0 || el.offsetWidth === 0;
  };

  const getOptions = computed((): EChartsOption => {
    if (!isDark.value) {
      return {};
    }

    return {
      backgroundColor: 'transparent',
    };
  });

  const initCharts = (t?: EchartsThemeType) => {
    const el = chartRef?.value?.$el;
    if (!el) {
      return;
    }
    chartInstance = echarts.init(el, t || isDark.value ? 'dark' : null);
    instanceMapReady = chinaMapLoaded;

    return chartInstance;
  };

  // ECharts 实例创建时就固定了已注册的数据处理、布局阶段，地图注册前创建的实例画不出地图：
  // 在首次设置地图配置之前重建实例；合并模式下先还原旧实例已合并的配置
  const reinitForMap = (keepOption: boolean) => {
    const option = keepOption ? chartInstance?.getOption() : undefined;
    if (option?.geo) {
      // 旧实例创建时 geo 组件尚未注册，主题（如 dark）里的 geo 样式被当作普通配置保存，
      // 注册后 getOption 会将其作为缺少 map 的 geo 组件返回，还原会报错；真实 geo 组件必有 map
      const geo = option.geo as GeoOptionItem | GeoOptionItem[];
      const geoList = Array.isArray(geo) ? geo : [geo];
      option.geo = geoList.filter((item) => item?.map);
    }
    chartInstance?.dispose();
    chartInstance = initCharts() ?? null;
    if (option) {
      chartInstance?.setOption(option);
    }
    return chartInstance;
  };

  const renderEcharts = (
    options: EChartsOption,
    clear = true,
  ): Promise<Nullable<echarts.ECharts>> => {
    if (!unref(isActiveRef)) {
      return Promise.resolve(null);
    }
    // 整体重新渲染，之前推迟或等待中的更新不再需要
    pendingUpdates = [];
    replaceId++;
    const result = doRenderEcharts(options, clear, ++renderId);
    // 之后的合并更新只需排在本次渲染之后，不再等待已作废的旧更新
    updateQueue = result.catch(() => {});
    return result;
  };

  const doRenderEcharts = async (
    options: EChartsOption,
    clear: boolean,
    id: number,
  ): Promise<Nullable<echarts.ECharts>> => {
    cacheOptions = options;
    if (isMapOptions(options)) {
      // 用到地图时，先等待地图加载、注册完成再渲染
      await loadChinaMap(options);
    }
    // 等待后校验：请求未过期、未卸载且处于激活状态；未激活时由激活后补渲染
    const canRender = () => {
      if (isStale(id)) {
        return false;
      }
      if (!unref(isActiveRef)) {
        pendingRender = true;
        return false;
      }
      return true;
    };
    if (!canRender()) {
      return getSkippedResult(id);
    }
    const currentOptions = {
      ...options,
      ...getOptions.value,
    };
    return new Promise((resolve) => {
      const retry = () => {
        useTimeoutFn(() => {
          resolve(
            canRender()
              ? doRenderEcharts(currentOptions, true, id)
              : getSkippedResult(id),
          );
        }, 30);
      };
      if (chartRef.value?.offsetHeight === 0) {
        retry();
        return;
      }
      nextTick(() => {
        if (!canRender()) {
          resolve(getSkippedResult(id));
          return;
        }
        const el = getChartEl();
        if (isElHidden(el)) {
          retry();
          return;
        }
        useTimeoutFn(() => {
          if (!canRender()) {
            resolve(getSkippedResult(id));
            return;
          }
          if (!chartInstance || chartInstance?.getDom() !== el) {
            chartInstance?.dispose();
            const instance = initCharts();
            if (!instance) {
              resolve(null);
              return;
            }
            chartInstance = instance;
          } else if (
            !instanceMapReady &&
            (isMapOptions(options) ||
              pendingUpdates.some((update) => isMapOptions(update.option)))
          ) {
            reinitForMap(!clear);
          }
          clear && chartInstance?.clear();
          chartInstance?.setOption(currentOptions);
          pendingUpdates.forEach((update) => {
            chartInstance?.setOption(
              { ...update.option, ...getOptions.value },
              { lazyUpdate: update.lazyUpdate, notMerge: update.notMerge },
            );
          });
          pendingUpdates = [];
          resolve(chartInstance);
        }, 30);
      });
    });
  };

  const updateData = (
    option: EChartsOption,
    notMerge = false, // false = 合并（保留动画），true = 完全替换
    lazyUpdate = false, // true 时不立即重绘，适合短时间内多次调用
  ): Promise<echarts.ECharts | null> => {
    if (notMerge) {
      // 完全替换：之前发出、仍在等待的整体渲染不再用旧配置覆盖本次更新
      renderId++;
      replaceId++;
    }
    const replace = replaceId;
    // 合并更新排在之前的 updateData 之后，完全替换的无需等待；用到地图时，先等待地图加载、注册完成再更新
    const ready = (notMerge ? Promise.resolve() : updateQueue).then(() =>
      loadChinaMap(option),
    );
    updateQueue = ready.catch(() => {});
    return new Promise((resolve, reject) => {
      ready.then(() => {
        nextTick(() => {
          if (isUnmounted || replace !== replaceId) {
            // 等待期间组件已卸载，或已有之后发出的整体替换，不再用旧配置覆盖
            resolve(isUnmounted ? null : chartInstance);
            return;
          }
          if (!unref(isActiveRef)) {
            if (chartInstance) {
              // 已有实例但未激活 → 推迟更新，激活后由下方 watch 重新渲染时补上
              pendingUpdates.push({ lazyUpdate, notMerge, option });
            } else {
              // 未激活 → 记录配置，激活后补渲染
              cacheOptions = option;
              pendingRender = true;
            }
            resolve(null);
            return;
          }
          if (!chartInstance) {
            // 还没初始化 → 当作首次渲染（不递增 replaceId，避免取代之后排队的更新）
            pendingUpdates = [];
            doRenderEcharts(option, true, ++renderId).then(resolve, reject);
            return;
          }

          const instance =
            !instanceMapReady && isMapOptions(option)
              ? reinitForMap(!notMerge)
              : chartInstance;
          if (!instance) {
            resolve(null);
            return;
          }

          // 合并你原有的全局配置（比如 backgroundColor）
          const finalOption = {
            ...option,
            ...getOptions.value,
          };

          instance.setOption(finalOption, {
            notMerge,
            lazyUpdate,
            // silent: true,     // 如果追求极致性能可开启（关闭所有事件）
          });
          if (notMerge) {
            // 完全替换的更新已取代尚未补上的旧更新；合并更新不能丢弃它们
            pendingUpdates = [];
          }

          resolve(instance);
        });
      }, reject);
    });
  };

  function resize() {
    const el = getChartEl();
    if (isElHidden(el)) {
      return;
    }
    chartInstance?.resize({
      animation: {
        duration: 300,
        easing: 'quadraticIn',
      },
    });
  }

  watch([width, height], () => {
    resizeHandler?.();
  });

  useResizeObserver(chartRef as never, resizeHandler);

  watch([isDark, isActiveRef], () => {
    if (chartInstance && unref(isActiveRef)) {
      chartInstance.dispose();
      initCharts();
      // 保留未激活期间推迟的更新，渲染后补上
      const result = doRenderEcharts(cacheOptions, true, ++renderId);
      // 之后的合并更新排在重渲染之后，避免只剩补丁、丢失整体配置；仍保持在之前的合并更新之后
      updateQueue = Promise.all([updateQueue, result]).catch(() => {});
      resize();
    }
  });

  tryOnUnmounted(() => {
    isUnmounted = true;
    // 销毁实例，释放资源
    chartInstance?.dispose();
  });
  return {
    isActive: isActiveRef,
    renderEcharts,
    resize,
    updateData,
    getChartInstance: () => chartInstance,
  };
}

export { useEcharts };

export type { EchartsUIType };
