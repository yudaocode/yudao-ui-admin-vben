<script lang="ts" setup>
import type { FormType } from '../data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesCalPlanShiftApi } from '#/api/mes/cal/plan/shift';

import { computed, ref, watch } from 'vue';

import { message, Modal } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createPlanShift,
  deletePlanShift,
  getPlanShiftListByPlan,
  updatePlanShift,
} from '#/api/mes/cal/plan/shift';
import { $t } from '#/locales';

const props = withDefaults(defineProps<{ formType?: FormType; planId: number }>(), {
  formType: 'update',
});
const isEditable = computed(() => props.formType !== 'detail'); // 是否可编辑
const formOpen = ref(false); // 班次表单是否打开
const formLoading = ref(false); // 班次表单提交中
const shiftFormType = ref<'create' | 'update'>('create'); // 班次表单模式
const formTitle = computed(() => (shiftFormType.value === 'create' ? '添加班次' : '修改班次'));
const list = ref<MesCalPlanShiftApi.PlanShift[]>([]); // 班次列表

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'planId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'sort',
      label: '顺序',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 1,
        precision: 0,
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'name',
      label: '班次名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入班次名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'startTime',
      label: '开始时间',
      component: 'TimePicker',
      componentProps: {
        format: 'HH:mm',
        placeholder: '请选择开始时间',
        valueFormat: 'HH:mm',
      },
      rules: 'required',
    },
    {
      fieldName: 'endTime',
      label: '结束时间',
      component: 'TimePicker',
      componentProps: {
        format: 'HH:mm',
        placeholder: '请选择结束时间',
        valueFormat: 'HH:mm',
      },
      rules: 'required',
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
      { field: 'sort', title: '顺序', width: 80 },
      { field: 'name', title: '班次名称', minWidth: 120 },
      { field: 'startTime', title: '开始时间', width: 100 },
      { field: 'endTime', title: '结束时间', width: 100 },
      { field: 'remark', title: '备注', minWidth: 150 },
      {
        title: '操作',
        width: 130,
        fixed: 'right',
        slots: {
          default: 'actions',
        },
        visible: isEditable.value,
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
  } as VxeTableGridOptions<MesCalPlanShiftApi.PlanShift>,
});

/** 加载班次列表 */
async function getList() {
  gridApi.setLoading(true);
  try {
    list.value = await getPlanShiftListByPlan(props.planId);
    gridApi.setGridOptions({ data: list.value });
  } finally {
    gridApi.setLoading(false);
  }
}

/** 打开班次表单 */
async function openForm(type: 'create' | 'update', row?: MesCalPlanShiftApi.PlanShift) {
  formOpen.value = true;
  shiftFormType.value = type;
  await formApi.resetForm();
  await formApi.setValues(row ? { ...row } : { planId: props.planId, sort: 1 });
}

/** 提交班次表单 */
async function submitForm() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  formLoading.value = true;
  try {
    const data = (await formApi.getValues()) as MesCalPlanShiftApi.PlanShift;
    await (shiftFormType.value === 'create' ? createPlanShift(data) : updatePlanShift(data));
    formOpen.value = false;
    message.success($t('ui.actionMessage.operationSuccess'));
    await getList();
  } finally {
    formLoading.value = false;
  }
}

/** 删除班次 */
async function handleDelete(id: number) {
  await deletePlanShift(id);
  message.success($t('ui.actionMessage.deleteSuccess', ['班次']));
  await getList();
}

watch(
  () => props.planId,
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
    <div v-if="isEditable" class="mb-3 flex items-center justify-start">
      <TableAction
        :actions="[{ label: '添加班次', type: 'primary', onClick: openForm.bind(null, 'create') }]"
      />
    </div>
    <Grid class="w-full">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            { label: '编辑', type: 'link', onClick: openForm.bind(null, 'update', row) },
            {
              label: '删除',
              type: 'link',
              danger: true,
              popConfirm: {
                title: '确认删除该班次吗？',
                confirm: handleDelete.bind(null, row.id!),
              },
            },
          ]"
        />
      </template>
    </Grid>
    <Modal
      v-model:open="formOpen"
      :title="formTitle"
      width="520px"
      :confirm-loading="formLoading"
      @ok="submitForm"
    >
      <Form class="mx-4" />
    </Modal>
  </div>
</template>
