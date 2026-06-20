<script lang="ts" setup>
import { computed, inject, nextTick, onMounted, ref, toRaw, watch } from 'vue';

import { cloneDeep } from '@vben/utils';

import { Form, FormItem, Select } from 'ant-design-vue';

import { getFormSimpleList } from '#/api/bpm/form';

defineOptions({ name: 'ElementForm' });

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
const prefix = inject('prefix');

const formKey = ref<number | string | undefined>(undefined);
const businessKey = ref('');
const fieldList = ref<any[]>([]);
const bpmnELement = ref();
const elExtensionElements = ref();
const formData = ref();
const otherExtensions = ref();

const bpmnInstances = () => (window as any)?.bpmnInstances;
const resetFormList = () => {
  bpmnELement.value = bpmnInstances().bpmnElement;
  formKey.value = bpmnELement.value.businessObject.formKey;
  // if (formKey.value?.length > 0) {
  //   formKey.value = parseInt(formKey.value)
  // }
  // 获取元素扩展属性 或者 创建扩展属性
  elExtensionElements.value =
    bpmnELement.value.businessObject.get('extensionElements') ||
    bpmnInstances().moddle.create('bpmn:ExtensionElements', { values: [] });
  // 获取元素表单配置 或者 创建新的表单配置
  formData.value =
    elExtensionElements.value.values.find(
      (ex: any) => ex.$type === `${prefix}:FormData`,
    ) || bpmnInstances().moddle.create(`${prefix}:FormData`, { fields: [] });

  // 业务标识 businessKey， 绑定在 formData 中
  businessKey.value = formData.value.businessKey;

  // 保留剩余扩展元素，便于后面更新该元素对应属性
  otherExtensions.value = elExtensionElements.value.values.filter(
    (ex: any) => ex.$type !== `${prefix}:FormData`,
  );

  // 复制原始值，填充表格
  fieldList.value = cloneDeep(formData.value.fields || []);

  // 更新元素扩展属性，避免后续报错
  updateElementExtensions();
};
const updateElementFormKey = () => {
  bpmnInstances().modeling.updateProperties(toRaw(bpmnELement.value), {
    formKey: formKey.value,
  });
};
const _updateElementBusinessKey = () => {
  bpmnInstances().modeling.updateModdleProperties(
    toRaw(bpmnELement.value),
    formData.value,
    {
      businessKey: businessKey.value,
    },
  );
};

const updateElementExtensions = () => {
  // 更新回扩展元素
  const newElExtensionElements = bpmnInstances().moddle.create(
    `bpmn:ExtensionElements`,
    {
      values: [...otherExtensions.value, formData.value],
    },
  );
  // 更新到元素上
  bpmnInstances().modeling.updateProperties(toRaw(bpmnELement.value), {
    extensionElements: newElExtensionElements,
  });
};

const formList = ref<any[]>([]); // 流程表单的下拉框的数据
const formOptions = computed(() => {
  return formList.value.map((form: any) => ({
    value: form.id,
    label: form.name,
  }));
});

onMounted(async () => {
  formList.value = await getFormSimpleList();
  formKey.value = formKey.value
    ? Number.parseInt(formKey.value as string)
    : undefined;
});

watch(
  () => props.id,
  (val: any) => {
    val &&
      val.length > 0 &&
      nextTick(() => {
        resetFormList();
      });
  },
  { immediate: true },
);
</script>

<template>
  <div class="panel-tab__content">
    <Form>
      <FormItem label="流程表单">
        <!--        <Input v-model:value="formKey" @change="updateElementFormKey" />-->
        <Select
          v-model:value="formKey"
          allow-clear
          @change="updateElementFormKey"
          :options="formOptions"
        />
      </FormItem>
      <FormItem label="业务标识">
        <Select
          v-model:value="businessKey"
          @change="_updateElementBusinessKey"
          allow-clear
        >
          <Select.Option v-for="i in fieldList" :key="i.id" :value="i.id">
            {{ i.label }}
          </Select.Option>
          <Select.Option value="">无</Select.Option>
        </Select>
      </FormItem>
    </Form>
  </div>
</template>
