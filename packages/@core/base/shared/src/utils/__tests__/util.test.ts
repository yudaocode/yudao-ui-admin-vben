import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  bindMethods,
  buildSocialRedirectUri,
  clearSocialCallback,
  getNestedValue,
  getSocialCallback,
  getUrlValue,
  restoreSocialRoute,
} from '../util';

class TestClass {
  public value: string;

  constructor(value: string) {
    this.value = value;
    bindMethods(this); // 调用通用方法
  }

  getValue() {
    return this.value;
  }

  setValue(newValue: string) {
    this.value = newValue;
  }
}

describe('bindMethods', () => {
  it('should bind methods to the instance correctly', () => {
    const instance = new TestClass('initial');

    // 解构方法
    const { getValue } = instance;

    // 检查 getValue 是否能正确调用，并且 this 绑定了 instance
    expect(getValue()).toBe('initial');
  });

  it('should bind multiple methods', () => {
    const instance = new TestClass('initial');

    const { getValue, setValue } = instance;

    // 检查 getValue 和 setValue 方法是否正确绑定了 this
    setValue('newValue');
    expect(getValue()).toBe('newValue');
  });

  it('should not bind non-function properties', () => {
    const instance = new TestClass('initial');

    // 检查普通属性是否保持原样
    expect(instance.value).toBe('initial');
  });

  it('should not bind constructor method', () => {
    const instance = new TestClass('test');

    // 检查 constructor 是否没有被绑定
    expect(instance.constructor.name).toBe('TestClass');
  });

  it('should not bind getter/setter properties', () => {
    class TestWithGetterSetter {
      get value() {
        return this._value;
      }

      set value(newValue: string) {
        this._value = newValue;
      }

      private _value: string = 'test';

      constructor() {
        bindMethods(this);
      }
    }

    const instance = new TestWithGetterSetter();
    const { value } = instance;

    // Getter 和 setter 不应被绑定
    expect(value).toBe('test');
  });
});

describe('getNestedValue', () => {
  interface UserProfile {
    age: number;
    name: string;
  }

  interface UserSettings {
    theme: string;
  }

  interface Data {
    user: {
      profile: UserProfile;
      settings: UserSettings;
    };
  }

  const data: Data = {
    user: {
      profile: {
        age: 25,
        name: 'Alice',
      },
      settings: {
        theme: 'dark',
      },
    },
  };

  it('should get a nested value when the path is valid', () => {
    const result = getNestedValue(data, 'user.profile.name');
    expect(result).toBe('Alice');
  });

  it('should return undefined for non-existent property', () => {
    const result = getNestedValue(data, 'user.profile.gender');
    expect(result).toBeUndefined();
  });

  it('should return undefined when accessing a non-existent deep path', () => {
    const result = getNestedValue(data, 'user.nonexistent.field');
    expect(result).toBeUndefined();
  });

  it('should return undefined if a middle level is undefined', () => {
    const result = getNestedValue({ user: undefined }, 'user.profile.name');
    expect(result).toBeUndefined();
  });

  it('should return the correct value for a nested setting', () => {
    const result = getNestedValue(data, 'user.settings.theme');
    expect(result).toBe('dark');
  });

  it('should work for a single-level path', () => {
    const result = getNestedValue({ a: 1, b: 2 }, 'b');
    expect(result).toBe(2);
  });

  it('should throw if path is empty', () => {
    expect(() => getNestedValue(data, '')).toThrow(
      'Path must be a non-empty string',
    );
  });

  it('should handle paths with array indexes', () => {
    const complexData = { list: [{ name: 'Item1' }, { name: 'Item2' }] };
    const result = getNestedValue(complexData, 'list.1.name');
    expect(result).toBe('Item2');
  });

  it('should return undefined when accessing an out-of-bounds array index', () => {
    const complexData = { list: [{ name: 'Item1' }] };
    const result = getNestedValue(complexData, 'list.2.name');
    expect(result).toBeUndefined();
  });
});

/** 模拟第三方平台的回调：直接在回调地址后拼接 code、state */
function socialCallback(redirectUri: string, params: string) {
  const url = redirectUri.slice(location.origin.length);
  window.history.replaceState(null, '', `${url}&${params}`);
}

describe('social callback', () => {
  // 登录页 query 中的 redirect，已经被 encode 一次，且包含 ?、&、#
  const redirect = encodeURIComponent('/system/user?id=1&tab=a#b');

  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('should build history redirect uri with base', () => {
    const redirectUri = buildSocialRedirectUri('/admin/auth/social-login', {
      redirect,
      type: 20,
    });
    expect(redirectUri).not.toContain('#');
    expect(
      redirectUri.startsWith(`${location.origin}/admin/auth/social-login?`),
    ).toBe(true);

    socialCallback(redirectUri, 'code=test_code&state=test_state');
    expect(getUrlValue('type')).toBe('20');
    expect(getUrlValue('redirect')).toBe(redirect);
    // 登录成功后，路由守卫会 decode 一次 redirect 再跳转
    expect(decodeURIComponent(getUrlValue('redirect'))).toBe(
      '/system/user?id=1&tab=a#b',
    );
    expect(getSocialCallback()).toEqual({
      code: 'test_code',
      state: 'test_state',
    });
  });

  it('should build hash redirect uri before #, and restore route', () => {
    window.history.replaceState(null, '', '/admin/#/auth/login');
    const redirectUri = buildSocialRedirectUri('#/auth/social-login', {
      redirect,
      type: 20,
    });
    expect(redirectUri).not.toContain('#');
    expect(redirectUri.startsWith(`${location.origin}/admin/?`)).toBe(true);

    // 钉钉新版登录，回调的是 authCode
    socialCallback(redirectUri, 'authCode=test_code&state=test_state');
    expect(location.hash).toBe('');
    restoreSocialRoute();
    expect(location.pathname).toBe('/admin/');
    expect(location.hash).toBe('#/auth/social-login');
    expect(getUrlValue('type')).toBe('20');
    expect(getUrlValue('redirect')).toBe(redirect);
    expect(getSocialCallback()).toEqual({
      code: 'test_code',
      state: 'test_state',
    });

    // hash 路由：回调参数不属于路由地址，只清理地址栏，不需要同步 vue-router
    const routerHistory = {
      base: '/admin/#',
      location: '/auth/social-login',
      replace: vi.fn(),
    };
    clearSocialCallback(routerHistory);
    expect(routerHistory.replace).not.toHaveBeenCalled();
    expect(location.pathname).toBe('/admin/');
    expect(location.hash).toBe('#/auth/social-login');
    expect(location.href).not.toContain('test_code');
    expect(getSocialCallback()).toEqual({ code: '', state: '' });
    // 只保留 redirect，且 getUrlValue() 读取结果不变（没有多 decode）
    expect(getUrlValue('redirect')).toBe(redirect);
    expect(getUrlValue('type')).toBe('');
    expect(getUrlValue('socialRoute')).toBe('');
  });

  it('should sync vue-router history when clearing history callback', () => {
    // 社交登录页回填 redirect 后的地址：整体 encode 的参数 + 回调参数 + 路由 query 中的 redirect
    const redirectUri = buildSocialRedirectUri('/admin/auth/social-login', {
      redirect,
      type: 20,
    });
    socialCallback(
      redirectUri,
      `authCode=test_code&state=test_state&redirect=${encodeURIComponent(redirect)}#tab`,
    );
    // history 路由：vue-router 记录的当前地址，不含 base
    const routerHistory = {
      base: '/admin',
      location: `${location.pathname.slice('/admin'.length)}${location.search}${location.hash}`,
      replace: vi.fn(),
    };
    clearSocialCallback(routerHistory);
    // 路由 query 中的 redirect 原样保留，其它参数全部清理，hash 保留
    expect(routerHistory.replace).toHaveBeenCalledTimes(1);
    expect(routerHistory.replace).toHaveBeenCalledWith(
      `/auth/social-login?redirect=${encodeURIComponent(redirect)}#tab`,
    );
  });

  it('should keep encoded redirect target when clearing callback', () => {
    // redirect 目标包含 query、hash、中文、%、&、+
    const target = '/system/user?name=a%26b&plus=1%2B1+2&text=中文#tab';
    const redirectUri = buildSocialRedirectUri('/auth/social-login', {
      redirect: target,
      type: 20,
    });
    socialCallback(
      redirectUri,
      'code=test_code&authCode=other&state=test_state',
    );
    const routerHistory = {
      base: '',
      get location() {
        return `${location.pathname}${location.search}${location.hash}`;
      },
      replace: vi.fn((to: string) => window.history.replaceState(null, '', to)),
    };
    clearSocialCallback(routerHistory);
    expect(routerHistory.replace).toHaveBeenCalledTimes(1);
    expect(location.pathname).toBe('/auth/social-login');
    expect(getSocialCallback()).toEqual({ code: '', state: '' });
    expect(getUrlValue('redirect')).toBe(target);
    expect(getUrlValue('type')).toBe('');
    expect(location.href).not.toContain('test_code');
    expect(location.href).not.toContain('other');

    // 再次清理（例如说，刷新后）：没有需要清理的参数，不再修改地址
    clearSocialCallback(routerHistory);
    expect(routerHistory.replace).toHaveBeenCalledTimes(1);
    expect(getUrlValue('redirect')).toBe(target);
  });

  it('should clear all callback params without redirect', () => {
    window.history.replaceState(null, '', '/#/profile');
    const redirectUri = buildSocialRedirectUri('#/profile', { type: 20 });
    socialCallback(redirectUri, 'code=test_code&state=test_state');
    restoreSocialRoute();
    clearSocialCallback({ base: '/#', location: '/profile', replace: vi.fn() });
    expect(location.search).toBe('');
    expect(location.hash).toBe('#/profile');

    // 无法解析的参数（非法的 % 编码）也一并清理
    window.history.replaceState(null, '', '/?%E0%A4%A&state=test_state');
    clearSocialCallback({ base: '/#', location: '/', replace: vi.fn() });
    expect(location.search).toBe('');
  });

  it('should restore hash route for social bind', () => {
    window.history.replaceState(null, '', '/#/profile');
    const redirectUri = buildSocialRedirectUri('#/profile', { type: 20 });
    socialCallback(redirectUri, 'code=test_code&state=test_state');
    restoreSocialRoute();
    expect(location.hash).toBe('#/profile');
    expect(getUrlValue('type')).toBe('20');
  });

  it('should not restore route when not needed', () => {
    window.history.replaceState(
      null,
      '',
      `/?${encodeURIComponent('socialRoute=/profile')}#/dashboard`,
    );
    restoreSocialRoute();
    expect(location.hash).toBe('#/dashboard');

    window.history.replaceState(null, '', '/?code=test_code&state=test_state');
    restoreSocialRoute();
    expect(location.hash).toBe('');

    window.history.replaceState(null, '', '/?code=%E0%A4%A&state=test_state');
    expect(() => restoreSocialRoute()).not.toThrow();
    expect(location.hash).toBe('');
  });

  it('should decode code and state only once', () => {
    window.history.replaceState(
      null,
      '',
      '/?code=test_code&authCode=other_code&state=a%252Bb',
    );
    expect(getSocialCallback()).toEqual({ code: 'test_code', state: 'a%2Bb' });
  });
});
