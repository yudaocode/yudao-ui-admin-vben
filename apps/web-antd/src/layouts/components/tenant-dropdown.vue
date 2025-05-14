<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import type { SystemTenantApi } from '#/api/system/tenant';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { isTenantEnable, useTabs } from '@vben/hooks';
import { useAccessStore } from '@vben/stores';

import { message, Select } from 'ant-design-vue';

import { getSimpleTenantList } from '#/api/system/tenant';
import { $t } from '#/locales';

const { closeOtherTabs, refreshTab } = useTabs();

const { hasAccessByCodes } = useAccess();
const accessStore = useAccessStore();

const tenantEnable = isTenantEnable();

const value = ref<number>(accessStore.visitTenantId ?? undefined); // 当前访问的租户 ID
const tenants = ref<SystemTenantApi.Tenant[]>([]); // 租户列表

// TODO @xingyu：这个有可能 3 端复用么？
async function handleChange(id: SelectValue) {
  // 设置访问租户 ID
  accessStore.setVisitTenantId(id as number);
  // 关闭其他标签页，只保留当前页
  await closeOtherTabs();
  // 刷新当前页面
  await refreshTab();
  // 提示切换成功
  const tenant = tenants.value.find((item) => item.id === id);
  if (tenant) {
    message.success(`切换当前租户为: ${tenant.name}`);
  }
}

onMounted(async () => {
  if (!tenantEnable) {
    return;
  }
  tenants.value = await getSimpleTenantList();
});
</script>
<template>
  <div v-if="tenantEnable && hasAccessByCodes(['system:tenant:visit'])">
    <Select
      v-model:value="value"
      :field-names="{ label: 'name', value: 'id' }"
      :options="tenants"
      :placeholder="$t('page.tenant.placeholder')"
      :dropdown-style="{ position: 'fixed', zIndex: 1666 }"
      allow-clear
      class="w-40"
      @change="handleChange"
    />
  </div>
</template>
