<script lang="ts" setup>
import { Button, message } from 'ant-design-vue';

defineOptions({ name: 'MesWmPrinterLabel' });

withDefaults(
  defineProps<{
    bizCode?: string;
    bizId?: number;
    bizType?: string;
    labelText?: string;
  }>(),
  {
    bizCode: undefined,
    bizId: undefined,
    bizType: undefined,
    labelText: '标签打印',
  },
);

function handlePrint() {
  message.warning('标签打印功能暂未实现，敬请期待');
}
</script>

<template>
  <Button type="link" @click="handlePrint">
    {{ labelText }}
  </Button>
</template>
