import { buildShortUUID } from './uuid';

export function bindMethods<T extends object>(instance: T): void {
  const prototype = Object.getPrototypeOf(instance);
  const propertyNames = Object.getOwnPropertyNames(prototype);

  propertyNames.forEach((propertyName) => {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);
    const propertyValue = instance[propertyName as keyof T];

    if (
      typeof propertyValue === 'function' &&
      propertyName !== 'constructor' &&
      descriptor &&
      !descriptor.get &&
      !descriptor.set
    ) {
      instance[propertyName as keyof T] = propertyValue.bind(instance);
    }
  });
}

/**
 * 获取嵌套对象的字段值
 * @param obj - 要查找的对象
 * @param path - 用于查找字段的路径，使用小数点分隔
 * @returns 字段值，或者未找到时返回 undefined
 */
export function getNestedValue<T>(obj: T, path: string): any {
  if (typeof path !== 'string' || path.length === 0) {
    throw new Error('Path must be a non-empty string');
  }
  // 把路径字符串按 "." 分割成数组
  const keys = path.split('.') as (number | string)[];

  let current: any = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key as keyof typeof current];
  }

  return current;
}

/**
 * 获取链接的参数值（值类型）
 * @param key 参数键名
 * @param urlStr 链接地址，默认为当前浏览器的地址
 */
export function getUrlNumberValue(
  key: string,
  urlStr: string = location.href,
): number {
  return Number(getUrlValue(key, urlStr));
}

/**
 * 获取链接的参数值
 * @param key 参数键名
 * @param urlStr 链接地址，默认为当前浏览器的地址
 */
export function getUrlValue(
  key: string,
  urlStr: string = location.href,
): string {
  if (!urlStr || !key) return '';
  const url = new URL(decodeURIComponent(urlStr));
  return url.searchParams.get(key) ?? '';
}

/** 第三方登录回调时，记录 hash 路由的目标路由的参数名 */
const SOCIAL_ROUTE_KEY = 'socialRoute';

/**
 * 获得第三方登录（社交登录、社交绑定）的回调地址
 *
 * 1. params 需要整体 encode 一次，否则钉钉回调会丢失参数，配合 getUrlValue() 使用
 * 2. hash 路由时，回调地址不能带 #，否则 code、state 会被拼接到 # 之后，导致回调参数丢失（https://t.zsxq.com/QY7xI）。
 *    所以回调到 # 之前的页面，并通过 socialRoute 参数记录目标路由，配合 restoreSocialRoute() 使用
 *
 * @param href 目标路由的 href，即 router.resolve(path).href。history 路由为 /base/path，hash 路由为 #/path
 * @param params 回调需要携带的参数，例如说 type、redirect
 */
export function buildSocialRedirectUri(
  href: string,
  params: Record<string, number | string>,
): string {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
  let path = href;
  const hashIndex = href.indexOf('#');
  if (hashIndex !== -1) {
    query.set(SOCIAL_ROUTE_KEY, href.slice(hashIndex + 1));
    path = href.slice(0, hashIndex) || location.pathname;
  }
  return `${location.origin}${path}?${encodeURIComponent(query.toString())}`;
}

/**
 * 还原第三方登录回调的目标路由，需要在创建 hash 路由前调用
 *
 * 配合 buildSocialRedirectUri() 使用：将 /?socialRoute=/xxx&code=... 还原为 /?socialRoute=/xxx&code=...#/xxx
 */
export function restoreSocialRoute(): void {
  // 已经有路由，无需还原
  if (location.hash.length > 2) {
    return;
  }
  let route: string;
  try {
    route = getUrlValue(SOCIAL_ROUTE_KEY);
  } catch {
    // 地址无法解析（例如说，非法的 % 编码），保持原样
    return;
  }
  if (!route.startsWith('/')) {
    return;
  }
  window.history.replaceState(
    window.history.state,
    '',
    `${location.pathname}${location.search}#${route}`,
  );
}

/**
 * 获得第三方登录回调的 code、state
 *
 * 1. 从 location.search 读取，兼容 history、hash 路由（hash 路由时，回调参数在 # 之前）
 * 2. 钉钉新版登录回调的是 authCode，其它平台是 code
 */
export function getSocialCallback(): { code: string; state: string } {
  const searchParams = new URLSearchParams(location.search);
  return {
    code: searchParams.get('code') || searchParams.get('authCode') || '',
    state: searchParams.get('state') ?? '',
  };
}

/** 第三方登录回调清理后，仍需保留的参数：登录后的重定向地址，不含敏感信息 */
const SOCIAL_REDIRECT_KEY = 'redirect';

/** vue-router 的 RouterHistory，即 router.options.history，这里只声明用到的属性 */
export interface SocialRouterHistory {
  readonly base: string;
  readonly location: string;
  replace(to: string): void;
}

/**
 * 清理第三方登录回调的 search，只保留 redirect，且不改变 redirect 的编码
 *
 * 1. 路由 query 中的 redirect（例如说，社交登录页回填的 redirect）：原样保留
 * 2. buildSocialRedirectUri() 整体 encode 的参数：只保留其中的 redirect，并按同样的方式 encode，配合 getUrlValue() 使用
 * 3. 其它参数（code、authCode、state 等授权参数，以及 type、socialRoute）：全部清理
 */
function cleanSocialSearch(search: string): string {
  const routeRedirects: string[] = [];
  const encodedRedirects: string[] = [];
  for (const segment of search.slice(1).split('&')) {
    const [rawKey = ''] = segment.split('=');
    try {
      const key = decodeURIComponent(rawKey.replaceAll('+', ' '));
      if (key === SOCIAL_REDIRECT_KEY) {
        routeRedirects.push(segment);
      } else if (!segment.includes('=') && key.includes('=')) {
        const redirect = new URLSearchParams(key).get(SOCIAL_REDIRECT_KEY);
        if (redirect !== null) {
          const params = new URLSearchParams({
            [SOCIAL_REDIRECT_KEY]: redirect,
          });
          encodedRedirects.push(encodeURIComponent(params.toString()));
        }
      }
    } catch {
      // 无法解析的参数（例如说，非法的 % 编码），直接清理
    }
  }
  // 两者都有时，优先使用路由 query 中的 redirect，同社交登录页
  const segments =
    routeRedirects.length > 0 ? routeRedirects : encodedRedirects;
  return segments.length > 0 ? `?${segments.join('&')}` : '';
}

/**
 * 清理第三方登录回调残留在地址栏的参数，避免 code 泄露或重复使用
 *
 * 1. 只保留非敏感的 redirect，刷新后仍然可以回到原目标，详见 cleanSocialSearch() 说明
 * 2. hash 路由：回调参数在 # 之前，不属于路由地址，清理地址栏即可。之后 vue-router 使用 #/xxx 相对地址跳转，会沿用清理后的地址
 * 3. history 路由：回调参数属于路由地址，vue-router 会记录在 history.state.current 等处，并在下次 push 时写回地址栏。
 *    所以使用 routerHistory.replace() 同步更新地址栏、history.state、vue-router 记录的当前地址，它不会触发路由跳转，不会重建页面
 *
 * @param routerHistory 路由的 history，即 router.options.history
 */
export function clearSocialCallback(routerHistory: SocialRouterHistory): void {
  const search = cleanSocialSearch(location.search);
  if (search === location.search) {
    return;
  }
  if (routerHistory.base.includes('#')) {
    window.history.replaceState(
      window.history.state,
      '',
      `${location.pathname}${search}${location.hash}`,
    );
    return;
  }
  const [path = ''] = routerHistory.location.split(/[?#]/);
  routerHistory.replace(`${path}${search}${location.hash}`);
}

/**
 * 将值复制到目标对象，且以目标对象属性为准，例：target: {a:1} source:{a:2,b:3} 结果为：{a:2}
 * @param target 目标对象
 * @param source 源对象
 */
export function copyValueToTarget(target: any, source: any) {
  const newObj = Object.assign({}, target, source);
  // 删除多余属性
  Object.keys(newObj).forEach((key) => {
    // 如果不是target中的属性则删除
    if (!Object.keys(target).includes(key)) {
      delete newObj.key;
    }
  });
  // 更新目标对象值
  Object.assign(target, newObj);
}

/** 实现 groupBy 功能 */
export function groupBy(array: any[], key: string) {
  const result: Record<string, any[]> = {};
  for (const item of array) {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
  }
  return result;
}

/**
 * 解析 JSON 字符串
 *
 * @param str
 */
export function jsonParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    console.warn(`str[${str}] 不是一个 JSON 字符串`);
    return str;
  }
}

const stableObjectKeyMap = new WeakMap<object, string>();

/**
 * 为对象引用生成稳定 key，不写入对象本身。
 *
 * 适用于 v-for 使用对象或数组项作为渲染单位，但不希望把 UI 字段混入业务数据的场景。
 */
export function getStableObjectKey(
  item: object,
  generator: () => string = buildShortUUID,
): string {
  let key = stableObjectKeyMap.get(item);
  if (!key) {
    key = generator();
    stableObjectKeyMap.set(item, key);
  }
  return key;
}
