<script lang="ts" setup>
import { ElMessage } from 'element-plus';

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
  ElMessage.warning('标签打印功能暂未实现，敬请期待');
}
</script>

<template>
  <ElButton link type="primary" @click="handlePrint">
    {{ labelText }}
  </ElButton>
</template>
