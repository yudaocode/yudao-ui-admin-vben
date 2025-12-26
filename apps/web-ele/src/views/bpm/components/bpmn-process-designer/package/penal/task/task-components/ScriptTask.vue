<script lang="ts" setup>
import { nextTick, onBeforeUnmount, ref, toRaw, watch } from 'vue';

import { ElForm, ElFormItem, ElInput, ElOption, ElSelect } from 'element-plus';

defineOptions({ name: 'ScriptTask' });
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
const defaultTaskForm = ref({
  scriptFormat: '',
  script: '',
  resource: '',
  resultVariable: '',
});
const scriptTaskForm = ref<any>({});
const bpmnElement = ref();

const bpmnInstances = () => (window as any)?.bpmnInstances;

const resetTaskForm = () => {
  for (const key in defaultTaskForm.value) {
    // @ts-ignore
    scriptTaskForm.value[key] =
      bpmnElement.value?.businessObject[
        key as keyof typeof defaultTaskForm.value
      ] || defaultTaskForm.value[key as keyof typeof defaultTaskForm.value];
  }
  scriptTaskForm.value.scriptType = scriptTaskForm.value.script
    ? 'inline'
    : 'external';
};
const updateElementTask = () => {
  const taskAttr = Object.create(null);
  taskAttr.scriptFormat = scriptTaskForm.value.scriptFormat || null;
  taskAttr.resultVariable = scriptTaskForm.value.resultVariable || null;
  if (scriptTaskForm.value.scriptType === 'inline') {
    taskAttr.script = scriptTaskForm.value.script || null;
    taskAttr.resource = null;
  } else {
    taskAttr.resource = scriptTaskForm.value.resource || null;
    taskAttr.script = null;
  }
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), taskAttr);
};

onBeforeUnmount(() => {
  bpmnElement.value = null;
});

watch(
  () => props.id,
  () => {
    bpmnElement.value = bpmnInstances().bpmnElement;
    nextTick(() => {
      resetTaskForm();
    });
  },
  { immediate: true },
);
</script>

<template>
  <div class="mt-4">
    <ElForm label-width="80px">
      <ElFormItem label="脚本格式">
        <ElInput
          v-model="scriptTaskForm.scriptFormat"
          clearable
          @input="updateElementTask()"
          @change="updateElementTask()"
        />
      </ElFormItem>
      <!-- TODO scriptType  外部资源 和 内联脚本，  flowable 文档 https://www.flowable.com/open-source/docs/bpmn/ch07b-BPMN-Constructs#script-task  没看到到有相应的属性 -->
      <ElFormItem label="脚本类型">
        <ElSelect v-model="scriptTaskForm.scriptType">
          <ElOption value="inline" label="内联脚本" />
          <ElOption value="external" label="外部资源" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="脚本" v-show="scriptTaskForm.scriptType === 'inline'">
        <ElInput
          type="textarea"
          v-model="scriptTaskForm.script"
          :autosize="{ minRows: 2, maxRows: 4 }"
          clearable
          @input="updateElementTask()"
          @change="updateElementTask()"
        />
      </ElFormItem>
      <ElFormItem
        label="资源地址"
        v-show="scriptTaskForm.scriptType === 'external'"
      >
        <ElInput
          v-model="scriptTaskForm.resource"
          clearable
          @input="updateElementTask()"
          @change="updateElementTask()"
        />
      </ElFormItem>
      <ElFormItem label="结果变量">
        <ElInput
          v-model="scriptTaskForm.resultVariable"
          clearable
          @input="updateElementTask()"
          @change="updateElementTask()"
        />
      </ElFormItem>
    </ElForm>
  </div>
</template>
