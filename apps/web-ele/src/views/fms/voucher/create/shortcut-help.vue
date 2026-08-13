<script lang="ts" setup>
import { ElButton, ElPopover } from 'element-plus';

defineOptions({ name: 'FmsVoucherShortcutHelp' });

const shortcuts = [
  { name: '保存并新增', key: 'F12' },
  { name: '新增', key: 'Alt + N' },
  { name: '下一输入项', key: 'Enter' },
  { name: '切换输入项', key: '方向键' },
  { name: '自动平衡借贷方金额', key: '=' },
  { name: '保存', key: 'Ctrl / ⌘ + S' },
] as const;
</script>

<template>
  <ElPopover placement="bottom-end" trigger="hover" :width="360">
    <template #reference>
      <ElButton link type="primary">快捷键</ElButton>
    </template>
    <div class="mb-2 font-600">凭证录入快捷键</div>
    <div
      v-for="item in shortcuts"
      :key="item.name"
      class="border-border flex min-h-[34px] items-center justify-between border-0 border-b border-solid last:border-b-0"
    >
      <span>{{ item.name }}</span>
      <kbd
        class="border-border bg-accent min-w-[78px] rounded border border-solid px-[7px] py-[3px] text-center shadow-[0_1px_0_hsl(var(--border))]"
      >
        {{ item.key }}
      </kbd>
    </div>
  </ElPopover>
</template>
