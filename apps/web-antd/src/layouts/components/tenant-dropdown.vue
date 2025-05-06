<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { isTenantEnable, useRefresh } from '@vben/hooks';
import { useAccessStore } from '@vben/stores';

import { Button, Dropdown, Menu } from 'ant-design-vue';

import { getTenantList } from '#/api/system/tenant';

const { refresh } = useRefresh();

const { hasAccessByCodes } = useAccess();
const accessStore = useAccessStore();

const tenantEnable = isTenantEnable();

const visitTenantList = computed(() => {
  if (tenantEnable) {
    const list = accessStore.visitTenantId.map((item) => ({
      label: item.name,
      id: item.id,
    }));
    return list;
  }
  return [];
});

const tenant = ref<string>(
  visitTenantList.value.find((item) => item.id === accessStore.tenantId)
    ?.label || '切换租户',
);

function handleClick(id: number | undefined) {
  if (id) {
    accessStore.setTenantId(id);
    refresh();
    window.location.reload();
  }
}

onMounted(async () => {
  if (tenantEnable) {
    const resp = await getTenantList();
    accessStore.setVisitTenantId(resp);
  }
});
</script>
<template>
  <Dropdown v-if="tenantEnable && hasAccessByCodes(['system:tenant:visit'])">
    <template #overlay>
      <Menu>
        <template v-for="item in visitTenantList" :key="item.key">
          <Menu.Item @click="handleClick(item.id)">
            {{ item.label }}
          </Menu.Item>
        </template>
      </Menu>
    </template>
    <Button> {{ tenant }} </Button>
  </Dropdown>
</template>
