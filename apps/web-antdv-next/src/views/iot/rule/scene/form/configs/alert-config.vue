<!-- 告警配置组件 -->
<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useVModel } from '@vueuse/core';
import { FormItem, Select } from 'antdv-next';

import { getSimpleAlertConfigList } from '#/api/iot/alert/config';

/** 告警配置组件 */
defineOptions({ name: 'AlertConfig' });

const props = defineProps<{
  modelValue?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value?: number): void;
}>();

const localValue = useVModel(props, 'modelValue', emit);

const loading = ref(false); // 加载状态
const alertConfigs = ref<any[]>([]); // 告警配置列表

/** 处理选择变化事件 */
function handleChange(value?: any) {
  emit('update:modelValue', value);
}

/** 加载告警配置列表 */
async function loadAlertConfigs() {
  loading.value = true;
  try {
    alertConfigs.value = (await getSimpleAlertConfigList()) || [];
  } finally {
    loading.value = false;
  }
}

/** 初始化 **/
onMounted(() => {
  loadAlertConfigs();
});
</script>

<template>
  <div class="w-full">
    <FormItem label="告警配置" required>
      <Select
        v-model:value="localValue"
        :options="alertConfigs"
        :field-names="{ label: 'name', value: 'id' }"
        placeholder="请选择告警配置"
        show-search
        allow-clear
        @change="handleChange"
        class="w-full"
        :loading="loading"
      />
    </FormItem>
  </div>
</template>
