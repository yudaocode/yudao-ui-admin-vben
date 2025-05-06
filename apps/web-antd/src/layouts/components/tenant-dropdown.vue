<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { isTenantEnable, useTabs } from '@vben/hooks';
import { useAccessStore } from '@vben/stores';

import { message, Select } from 'ant-design-vue';

import { getTenantList } from '#/api/system/tenant';
import { $t } from '#/locales';
import { resetRoutes } from '#/router';
import { useAuthStore } from '#/store';

const { closeOtherTabs, refreshTab, closeAllTabs } = useTabs();

const { hasAccessByCodes } = useAccess();
const accessStore = useAccessStore();

const authStore = useAuthStore();

const tenantEnable = isTenantEnable();

const visitTenantList = accessStore.visitTenantId;

const tenant = ref<SelectValue>(accessStore.tenantId ?? 0);

async function handleClick(id: SelectValue) {
  accessStore.setTenantId(Number(id));
  await authStore.fetchUserInfo();
  await resetRoutes();
  await closeOtherTabs();
  await closeAllTabs();
  await refreshTab();
  message.success($t('page.tenant.success'));
}

onMounted(async () => {
  if (tenantEnable) {
    const resp = await getTenantList();
    accessStore.setVisitTenantId(
      resp
        .map((item) => ({ id: item.id, name: item.name }))
        .filter((item): item is { id: number; name: string } => !!item.id),
    );
  }
});
</script>
<template>
  <div v-if="tenantEnable && hasAccessByCodes(['system:tenant:visit'])">
    <Select
      v-model:value="tenant"
      :field-names="{ label: 'name', value: 'id' }"
      :options="visitTenantList"
      :placeholder="$t('page.tenant.placeholder')"
      :dropdown-style="{ position: 'fixed', zIndex: 1666 }"
      allow-clear
      class="w-40"
      @change="handleClick"
    />
  </div>
</template>
