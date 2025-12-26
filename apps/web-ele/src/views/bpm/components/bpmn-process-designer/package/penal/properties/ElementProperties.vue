<script lang="ts" setup>
import { inject, nextTick, ref, watch } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { cloneDeep } from '@vben/utils';

import { ElButton, ElDivider, ElForm, ElFormItem, ElInput } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

defineOptions({ name: 'ElementProperties' });

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

const elementPropertyList = ref<Array<{ name: string; value: string }>>([]);
const propertyForm = ref<{ name?: string; value?: string }>({});
const editingPropertyIndex = ref(-1);
const otherExtensionList = ref<any[]>([]);
const bpmnElementProperties = ref<any[]>([]);
const bpmnElementPropertyList = ref<any[]>([]);
const attributeFormRef = ref<any>();
const bpmnInstances = () => (window as any)?.bpmnInstances;

const resetAttributesList = () => {
  const instances = bpmnInstances();
  if (!instances || !instances.bpmnElement) return;

  // 直接使用原始BPMN元素，避免Vue响应式代理问题
  const bpmnElement = instances.bpmnElement;
  const businessObject = bpmnElement.businessObject;

  otherExtensionList.value = []; // 其他扩展配置
  bpmnElementProperties.value =
    businessObject?.extensionElements?.values?.filter((ex: any) => {
      if (ex.$type !== `${prefix}:Properties`) {
        otherExtensionList.value.push(ex);
      }
      return ex.$type === `${prefix}:Properties`;
    }) ?? [];

  bpmnElementPropertyList.value = bpmnElementProperties.value.flatMap(
    (current: any) => current.values,
  );
  elementPropertyList.value = cloneDeep(bpmnElementPropertyList.value ?? []);
};

const removeAttributes = (
  _attr: { name: string; value: string },
  index: number,
) => {
  confirm({
    title: '提示',
    content: '确认移除该属性吗？',
  }).then(() => {
    elementPropertyList.value.splice(index, 1);
    bpmnElementPropertyList.value.splice(index, 1);
    const propertiesObject = bpmnInstances().moddle.create(
      `${prefix}:Properties`,
      {
        values: bpmnElementPropertyList.value,
      },
    );
    updateElementExtensions(propertiesObject);
    resetAttributesList();
  });
};

const saveAttribute = async () => {
  try {
    await attributeFormRef.value?.validate();
  } catch {
    // 校验未通过，直接返回
    return;
  }

  const { name, value } = propertyForm.value;
  const instances = bpmnInstances();
  if (!instances || !instances.bpmnElement) return;

  const bpmnElement = instances.bpmnElement;

  if (editingPropertyIndex.value === -1) {
    // 新建属性字段
    const newPropertyObject = instances.moddle.create(`${prefix}:Property`, {
      name,
      value,
    });
    // 新建一个属性字段的保存列表
    const propertiesObject = instances.moddle.create(`${prefix}:Properties`, {
      values: [...bpmnElementPropertyList.value, newPropertyObject],
    });
    updateElementExtensions(propertiesObject);
  } else {
    instances.modeling.updateModdleProperties(
      bpmnElement,
      bpmnElementPropertyList.value[editingPropertyIndex.value],
      {
        name,
        value,
      },
    );
  }
  fieldModalApi.close();
  resetAttributesList();
};

const updateElementExtensions = (properties: any) => {
  const instances = bpmnInstances();
  if (!instances || !instances.bpmnElement) return;

  const bpmnElement = instances.bpmnElement;
  const extensions = instances.moddle.create('bpmn:ExtensionElements', {
    values: [...otherExtensionList.value, properties],
  });
  instances.modeling.updateProperties(bpmnElement, {
    extensionElements: extensions,
  });
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { type: 'seq', width: 50, title: '序号' },
      { field: 'name', title: '属性名', minWidth: 120 },
      { field: 'value', title: '属性值', minWidth: 120 },
      {
        title: '操作',
        width: 120,
        slots: { default: 'action' },
        fixed: 'right',
      },
    ],
    border: true,
    showOverflow: true,
    height: 'auto',
    toolbarConfig: {
      enabled: false,
    },
    pagerConfig: {
      enabled: false,
    },
  },
});

const [FieldModal, fieldModalApi] = useVbenModal({
  title: '属性配置',
  onConfirm: saveAttribute,
});

const openAttributesForm = (
  attr: null | { name: string; value: string },
  index: number,
) => {
  editingPropertyIndex.value = index;
  propertyForm.value = index === -1 ? {} : cloneDeep(attr || {});
  fieldModalApi.open();
  nextTick(() => {
    if (attributeFormRef.value) attributeFormRef.value.clearValidate();
  });
};

watch(
  elementPropertyList,
  (val) => {
    gridApi.setGridOptions({ data: val });
  },
  { deep: true },
);

watch(
  () => props.id,
  (val) => {
    if (val && val.length > 0) {
      resetAttributesList();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="-mx-2 mb-2">
    <Grid :data="elementPropertyList">
      <template #action="{ row, rowIndex }">
        <ElButton
          size="small"
          type="primary"
          link
          @click="openAttributesForm(row, rowIndex)"
        >
          编辑
        </ElButton>
        <ElDivider direction="vertical" />
        <ElButton
          size="small"
          type="danger"
          link
          @click="removeAttributes(row, rowIndex)"
        >
          移除
        </ElButton>
      </template>
    </Grid>
    <div class="mt-1 flex w-full items-center justify-center gap-2 px-2">
      <ElButton
        class="flex flex-1 items-center justify-center"
        type="primary"
        size="small"
        @click="openAttributesForm(null, -1)"
      >
        <template #icon>
          <IconifyIcon icon="ep:plus" />
        </template>
        添加属性
      </ElButton>
    </div>

    <FieldModal class="w-3/5">
      <ElForm :model="propertyForm" ref="attributeFormRef" label-width="80px">
        <ElFormItem
          label="属性名："
          prop="name"
          :rules="[{ required: true, message: '请输入属性名' }]"
        >
          <ElInput v-model="propertyForm.name" clearable />
        </ElFormItem>
        <ElFormItem
          label="属性值："
          prop="value"
          :rules="[{ required: true, message: '请输入属性值' }]"
        >
          <ElInput v-model="propertyForm.value" clearable />
        </ElFormItem>
      </ElForm>
    </FieldModal>
  </div>
</template>
