import { defineStore } from 'pinia';

export interface TenantState {
  tenantId?: number;
  tenantName?: string;
}

export const useTenantStore = defineStore('tenant', {
  actions: {
    $reset() {
      this.tenantId = undefined;
      this.tenantName = undefined;
    },
    setTenant(tenant: TenantState) {
      this.tenantId = tenant.tenantId;
      this.tenantName = tenant.tenantName;
    },
    setTenantId(id: number) {
      this.tenantId = id;
    },
    setTenantName(name: string) {
      this.tenantName = name;
    },
  },
  persist: {
    // 持久化
    pick: ['tenantId', 'tenantName'],
  },
  state: (): TenantState => ({
    tenantId: undefined,
    tenantName: undefined,
  }),
});
