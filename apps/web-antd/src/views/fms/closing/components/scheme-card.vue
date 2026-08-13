<script lang="ts" setup>
import type { CheckboxChangeEvent } from 'ant-design-vue/es/checkbox/interface';

import { useAccess } from '@vben/access';
import { IconifyIcon } from '@vben/icons';

import { Button, Checkbox } from 'ant-design-vue';

import { useFmsStore } from '#/views/fms/store/fms';
import { formatMoney } from '#/views/fms/utils/format';

defineOptions({ name: 'FmsClosingSchemeCard' });

defineProps<{
  balance: number; // 待结转金额
  checked: boolean; // 是否选中
  generateDisabled: boolean; // 是否禁止生成凭证
  name: string; // 方案名称
  voucherIds: number[]; // 当前期间已生成凭证编号数组
}>();

const emit = defineEmits<{
  generate: [];
  openVoucher: [voucherId: number];
  settings: [];
  'update:checked': [checked: boolean];
}>();

const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore(); // FMS 状态

/** 处理方案选择 */
function handleCheck(event: CheckboxChangeEvent) {
  emit('update:checked', event.target.checked);
}
</script>

<template>
  <div
    class="overflow-hidden rounded-md border border-solid bg-accent/40 px-2.5 pb-2.5"
  >
    <!-- 方案选择 -->
    <div class="flex h-11 items-center justify-between">
      <Checkbox
        v-if="fmsStore.isAccountSetWritable"
        :checked="checked"
        @change="handleCheck"
      >
        {{ name }}
      </Checkbox>
      <span v-else>{{ name }}</span>
      <Button
        v-if="
          fmsStore.isAccountSetWritable &&
          hasAccessByCodes(['fms:closing:update'])
        "
        size="small"
        type="link"
        @click="emit('settings')"
      >
        <IconifyIcon icon="lucide:settings" />
      </Button>
    </div>
    <!-- 待结转金额 -->
    <div class="min-h-[82px] rounded-md bg-background p-4 shadow-sm">
      <div class="text-[18px] font-semibold">{{ formatMoney(balance) }}</div>
      <div
        class="mt-2 flex min-h-6 items-center justify-between text-xs text-muted-foreground"
      >
        <span>金额</span>
        <span
          v-if="voucherIds.length"
          class="flex max-w-[150px] gap-1.5 overflow-auto whitespace-nowrap"
        >
          <Button
            v-for="voucherId in voucherIds"
            :key="voucherId"
            class="!h-auto !p-0"
            size="small"
            type="link"
            @click="emit('openVoucher', voucherId)"
          >
            凭证 #{{ voucherId }}
          </Button>
        </span>
      </div>
    </div>
    <!-- 生成凭证 -->
    <div class="flex h-9 items-center justify-end">
      <Button
        v-if="
          fmsStore.isAccountSetWritable &&
          hasAccessByCodes(['fms:closing:profit-loss'])
        "
        :disabled="generateDisabled"
        type="link"
        @click="emit('generate')"
      >
        {{ voucherIds.length ? '重新生成' : '生成凭证' }}
      </Button>
    </div>
  </div>
</template>
