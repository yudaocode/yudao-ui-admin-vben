import type { FmsAccountSetApi } from '#/api/fms/config/account-set';

import { defineStore } from 'pinia';

import { getCurrentMonth } from '#/api/fms/closing/period';
import { getAccountSetList } from '#/api/fms/config/account-set';
import { FmsAccountUserLevelEnum } from '#/api/fms/config/account-user';

const FMS_ACCOUNT_SET_CACHE_KEY = 'fmsAccountSet'; // 当前账套缓存 Key，仅在 FMS 模块内部使用

/** FMS 当前账套上下文 */
export interface FmsAccountSetContext {
  /** 账套编号 */
  id: number;
  /** 公司名称 */
  companyName: string;
  /** 当前用户的成员权限级别 */
  level: number;
}

/** FMS 状态 */
interface FmsState {
  /** 当前账套 */
  accountSet?: FmsAccountSetContext;
  /** 当前会计期间，格式为 YYYY-MM */
  currentMonth?: string;
  /** 当前用户可访问的账套 */
  accountSetList: FmsAccountSetApi.AccountSet[];
  /** 是否已加载账套列表 */
  accountSetListLoaded: boolean;
}

/** 读取缓存的当前账套 */
function getCachedAccountSet(): FmsAccountSetContext | undefined {
  try {
    const cached = localStorage.getItem(FMS_ACCOUNT_SET_CACHE_KEY);
    return cached ? (JSON.parse(cached) as FmsAccountSetContext) : undefined;
  } catch {
    return undefined;
  }
}

/** FMS 账套上下文 */
export const useFmsStore = defineStore('fms', {
  state: (): FmsState => ({
    accountSet: getCachedAccountSet(),
    currentMonth: undefined,
    accountSetList: [],
    accountSetListLoaded: false,
  }),
  getters: {
    getAccountSet(): FmsAccountSetContext | undefined {
      return this.accountSet;
    },
    getAccountSetId(): number | undefined {
      return this.accountSet?.id;
    },
    getCurrentMonth(): string | undefined {
      return this.currentMonth;
    },
    isAccountSetWritable(): boolean {
      return (
        this.accountSetListLoaded &&
        (this.accountSet?.level === FmsAccountUserLevelEnum.OWNER ||
          this.accountSet?.level === FmsAccountUserLevelEnum.WRITE)
      );
    },
    getAccountSetList(): FmsAccountSetApi.AccountSet[] {
      return this.accountSetList;
    },
  },
  actions: {
    /**
     * 加载当前用户可访问的账套，并恢复一个可用账套
     *
     * 优先使用缓存账套，其次使用默认账套，最后使用第一条已初始化账套
     */
    async loadAccountSetList(
      force = false,
    ): Promise<FmsAccountSetApi.AccountSet[]> {
      if (this.accountSetListLoaded && !force) {
        return this.accountSetList;
      }
      this.accountSetList = await getAccountSetList();
      this.accountSetListLoaded = true;
      const accountSet =
        this.accountSetList.find(
          (item) => item.id === this.accountSet?.id && item.initialized,
        ) ||
        this.accountSetList.find(
          (item) => item.defaultStatus && item.initialized,
        ) ||
        this.accountSetList.find((item) => item.initialized);
      if (accountSet) {
        this.setAccountSet({
          id: accountSet.id!,
          companyName: accountSet.companyName,
          level: accountSet.level!,
        });
      } else {
        this.clearAccountSet();
      }
      return this.accountSetList;
    },
    /** 设置当前账套，并写入本地缓存 */
    setAccountSet(accountSet: FmsAccountSetContext) {
      if (this.accountSet?.id !== accountSet.id) {
        this.currentMonth = undefined;
      }
      this.accountSet = accountSet;
      localStorage.setItem(
        FMS_ACCOUNT_SET_CACHE_KEY,
        JSON.stringify(accountSet),
      );
    },
    /** 加载当前账套的会计期间 */
    async loadCurrentMonth(): Promise<string | undefined> {
      const accountSetId = this.accountSet?.id;
      if (!accountSetId) return undefined;
      const currentMonth = await getCurrentMonth(accountSetId);
      if (this.accountSet?.id !== accountSetId) return undefined;
      this.currentMonth = currentMonth;
      return currentMonth;
    },
    /** 清空当前账套及会计期间 */
    clearAccountSet() {
      this.accountSet = undefined;
      this.currentMonth = undefined;
      localStorage.removeItem(FMS_ACCOUNT_SET_CACHE_KEY);
    },
  },
});
