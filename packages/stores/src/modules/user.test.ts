import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useUserStore } from './user';

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('returns correct userInfo', () => {
    const store = useUserStore();
    const userInfo: any = { name: 'Jane Doe', roles: [{ value: 'user' }] };
    store.setUserInfo(userInfo);
    expect(store.userInfo).toEqual(userInfo);
  });

  // 测试重置用户信息时的行为
  it('clears userInfo and userRoles when setting null userInfo', () => {
    const store = useUserStore();
    // 角色通过 setUserRoles 单独设置，setUserInfo 不覆盖已有角色
    store.setUserRoles(['user']);
    store.setUserInfo({ nickname: 'Jane Doe' } as any);
    expect(store.userInfo).not.toBeNull();
    expect(store.userRoles).toEqual(['user']);

    store.setUserInfo(null as any);
    expect(store.userInfo).toBeNull();
    expect(store.userRoles).toEqual([]);
  });

  // 测试在没有用户角色时返回空数组
  it('returns an empty array for userRoles if not set', () => {
    const store = useUserStore();
    expect(store.userRoles).toEqual([]);
  });
});
