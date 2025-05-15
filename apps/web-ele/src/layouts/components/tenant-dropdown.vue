<script lang="ts" setup>
// TODO @puhui999：下拉选择的宽度不对哈；
import type { SystemTenantApi } from '#/api/system/tenant';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { isTenantEnable, useTabs } from '@vben/hooks';
import { useAccessStore } from '@vben/stores';

import { ElMessage, ElOption, ElSelect } from 'element-plus';

import { getSimpleTenantList } from '#/api/system/tenant';
import { $t } from '#/locales';

const { closeOtherTabs, refreshTab } = useTabs();

const { hasAccessByCodes } = useAccess();
const accessStore = useAccessStore();

const tenantEnable = isTenantEnable();

const value = ref<number>(accessStore.visitTenantId ?? 0); // 当前访问的租户 ID
const tenants = ref<SystemTenantApi.Tenant[]>([]); // 租户列表

// TODO @xingyu：这个有可能 3 端复用么？
async function handleChange(id: number) {
  if (id === null) return;

  // 设置访问租户 ID
  accessStore.setVisitTenantId(id);
  // 关闭其他标签页，只保留当前页
  await closeOtherTabs();
  // 刷新当前页面
  await refreshTab();
  // 提示切换成功
  const tenant = tenants.value.find((item) => item.id === id);
  if (tenant) {
    ElMessage.success(`切换当前租户为: ${tenant.name}`);
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
    <ElSelect
      v-model="value"
      :placeholder="$t('page.tenant.placeholder')"
      clearable
      class="w-40"
      @change="handleChange"
    >
      <ElOption
        v-for="item in tenants"
        :key="item.id"
        :label="item.name"
        :value="item.id || 0"
      />
    </ElSelect>
  </div>
</template>
