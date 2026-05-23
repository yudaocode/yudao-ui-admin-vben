<!-- 告警配置组件 -->
<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useVModel } from '@vueuse/core';
import { ElFormItem, ElOption, ElSelect } from 'element-plus';

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

/**
 * 处理选择变化事件
 * @param value 选中的值
 */
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

// 组件挂载时加载数据
onMounted(() => {
  loadAlertConfigs();
});
</script>

<template>
  <div class="w-full">
    <ElFormItem label="告警配置" required>
      <ElSelect
        v-model="localValue"
        placeholder="请选择告警配置"
        filterable
        clearable
        @change="handleChange"
        class="w-full"
        :loading="loading"
      >
        <ElOption
          v-for="config in alertConfigs"
          :key="config.id"
          :label="config.name"
          :value="config.id"
        />
      </ElSelect>
    </ElFormItem>
  </div>
</template>
