<script lang="ts" setup>
import type { FormType } from '../data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdWorkstationToolApi } from '#/api/mes/md/workstation/tool';

import { computed, ref, watch } from 'vue';

import { message, Modal } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createWorkstationTool,
  deleteWorkstationTool,
  getWorkstationToolList,
  updateWorkstationTool,
} from '#/api/mes/md/workstation/tool';
import { getToolTypeSimpleList } from '#/api/mes/tm/tool/type';
import { $t } from '#/locales';

defineOptions({ name: 'MesMdWorkstationToolList' });

const props = withDefaults(
  defineProps<{
    formType?: FormType;
    workstationId: number;
  }>(),
  {
    formType: 'update',
  },
);

const isReadOnly = computed(() => props.formType === 'detail'); // 是否只读
const formOpen = ref(false); // 工装夹具表单是否打开
const formLoading = ref(false); // 工装夹具表单提交中
const formData = ref<MesMdWorkstationToolApi.WorkstationTool>();
const list = ref<MesMdWorkstationToolApi.WorkstationTool[]>([]); // 工装夹具列表

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'workstationId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'toolTypeId',
      label: '工具类型',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getToolTypeSimpleList,
        labelField: 'name',
        placeholder: '请选择工具类型',
        valueField: 'id',
      },
      dependencies: {
        triggerFields: ['id'],
        disabled: (values) => !!values.id,
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'quantity',
      label: '数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 1,
        precision: 0,
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ],
  showDefaultActions: false,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    autoResize: true,
    border: true,
    columns: [
      {
        field: 'toolTypeId',
        title: '工具类型编号',
        width: 140,
      },
      {
        field: 'toolTypeName',
        title: '工具类型名称',
        minWidth: 160,
      },
      {
        field: 'quantity',
        title: '数量',
        width: 100,
      },
      {
        field: 'remark',
        title: '备注',
        minWidth: 160,
      },
      {
        title: '操作',
        width: 130,
        fixed: 'right',
        slots: { default: 'actions' },
        visible: !isReadOnly.value,
      },
    ],
    data: list.value,
    minHeight: 240,
    pagerConfig: {
      enabled: false,
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    showOverflow: true,
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<MesMdWorkstationToolApi.WorkstationTool>,
});

/** 加载工装夹具列表 */
async function getList() {
  gridApi.setLoading(true);
  try {
    list.value = await getWorkstationToolList(props.workstationId);
    gridApi.setGridOptions({ data: list.value });
  } finally {
    gridApi.setLoading(false);
  }
}

/** 打开工装夹具表单 */
async function openForm(row?: MesMdWorkstationToolApi.WorkstationTool) {
  formOpen.value = true;
  formData.value = row;
  await formApi.resetForm();
  await formApi.setValues({
    quantity: 1,
    workstationId: props.workstationId,
    ...row,
  });
}

/** 提交工装夹具表单 */
async function submitForm() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  formLoading.value = true;
  try {
    const data =
      (await formApi.getValues()) as MesMdWorkstationToolApi.WorkstationTool;
    await (formData.value?.id
      ? updateWorkstationTool(data)
      : createWorkstationTool(data));
    formOpen.value = false;
    message.success($t('ui.actionMessage.operationSuccess'));
    await getList();
  } finally {
    formLoading.value = false;
  }
}

/** 删除工装夹具 */
async function handleDelete(id: number) {
  await deleteWorkstationTool(id);
  message.success($t('ui.actionMessage.deleteSuccess', ['工装夹具']));
  await getList();
}

watch(
  () => props.workstationId,
  (value) => {
    if (value) {
      getList();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div>
    <div v-if="!isReadOnly" class="mb-3 flex items-center justify-start">
      <TableAction
        :actions="[
          {
            label: '添加工具',
            type: 'primary',
            onClick: openForm.bind(null, undefined),
          },
        ]"
      />
    </div>
    <Grid class="w-full">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'link',
              onClick: openForm.bind(null, row),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
              popConfirm: {
                title: '确认删除该工装夹具吗？',
                confirm: handleDelete.bind(null, row.id!),
              },
            },
          ]"
        />
      </template>
    </Grid>

    <Modal
      v-model:open="formOpen"
      :title="formData?.id ? '编辑工具' : '添加工具'"
      width="520px"
      :confirm-loading="formLoading"
      @ok="submitForm"
    >
      <Form class="mx-4" />
    </Modal>
  </div>
</template>
