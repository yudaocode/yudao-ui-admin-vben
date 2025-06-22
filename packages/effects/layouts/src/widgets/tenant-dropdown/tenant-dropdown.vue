<script lang="ts" setup>
import { computed } from 'vue';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@vben-core/shadcn-ui';

interface Tenant {
  id?: number;
  name: string;
  packageId: number;
  contactName: string;
  contactMobile: string;
  accountCount: number;
  expireTime: Date;
  website: string;
  status: number;
}

defineOptions({
  name: 'TenantDropdown',
});

const props = defineProps<{
  tenantList?: Tenant[];
  visitTenantId?: null | number;
}>();

const emit = defineEmits(['success']);

// 租户列表
const tenants = computed(() => props.tenantList ?? []);

async function handleChange(id: number | undefined) {
  if (!id) {
    return;
  }
  const tenant = tenants.value.find((item) => item.id === id);

  emit('success', tenant);
}
</script>
<template>
  <!-- TODO @xingyu：1）未选择的时候，空着一块，有点怪。是不是有个 placeholder 会好看点哈（之前有 page.tenant.placeholder）？2）是不是要支持个 clear 选择 -->
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        class="hover:bg-accent ml-1 mr-2 h-8 w-24 cursor-pointer rounded-full p-1.5"
      >
        {{ tenants.find((item) => item.id === visitTenantId)?.name }}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-56 p-0 pb-1">
      <DropdownMenuGroup>
        <DropdownMenuItem
          v-for="tenant in tenants"
          :key="tenant.id"
          :disabled="tenant.id === visitTenantId"
          class="mx-1 flex cursor-pointer items-center rounded-sm py-1 leading-8"
          @click="handleChange(tenant.id)"
        >
          {{ tenant.name }}
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
