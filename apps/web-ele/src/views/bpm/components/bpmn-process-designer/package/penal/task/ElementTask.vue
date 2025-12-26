<script lang="ts" setup>
import { ref, watch } from 'vue';

import { ElCheckbox, ElForm, ElFormItem } from 'element-plus';

import { installedComponent } from './data';

defineOptions({ name: 'ElementTaskConfig' });

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: '',
  },
});
const taskConfigForm = ref({
  asyncAfter: false,
  asyncBefore: false,
  exclusive: false,
});
const witchTaskComponent = ref();

const bpmnElement = ref();

const bpmnInstances = () => (window as any).bpmnInstances;
const changeTaskAsync = () => {
  if (!taskConfigForm.value.asyncBefore && !taskConfigForm.value.asyncAfter) {
    taskConfigForm.value.exclusive = false;
  }
  bpmnInstances().modeling.updateProperties(bpmnInstances().bpmnElement, {
    ...taskConfigForm.value,
  });
};

watch(
  () => props.id,
  () => {
    bpmnElement.value = bpmnInstances().bpmnElement;
    taskConfigForm.value.asyncBefore =
      bpmnElement.value?.businessObject?.asyncBefore;
    taskConfigForm.value.asyncAfter =
      bpmnElement.value?.businessObject?.asyncAfter;
    taskConfigForm.value.exclusive =
      bpmnElement.value?.businessObject?.exclusive;
  },
  { immediate: true },
);
watch(
  () => props.type,
  () => {
    if (props.type) {
      // @ts-ignore
      witchTaskComponent.value = installedComponent[props.type].component;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="panel-tab__content">
    <ElForm>
      <!-- add by 芋艿：由于「异步延续」暂时用不到，所以这里 display 为 none -->
      <!-- TODO @jaosn：这里 antd 属性地 hidden，需要关注么？ -->
      <ElFormItem label="异步延续" class="!hidden">
        <ElCheckbox
          v-model="taskConfigForm.asyncBefore"
          @change="changeTaskAsync"
        >
          异步前
        </ElCheckbox>
        <ElCheckbox
          v-model="taskConfigForm.asyncAfter"
          @change="changeTaskAsync"
        >
          异步后
        </ElCheckbox>
        <ElCheckbox
          v-model="taskConfigForm.exclusive"
          v-if="taskConfigForm.asyncAfter || taskConfigForm.asyncBefore"
          @change="changeTaskAsync"
        >
          排除
        </ElCheckbox>
      </ElFormItem>
      <component :is="witchTaskComponent" v-bind="$props" />
    </ElForm>
  </div>
</template>
