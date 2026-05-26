<script lang="ts" setup>
import type { FormType } from '../data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvCheckPlanMachineryApi } from '#/api/mes/dv/checkplan/machinery';

import { computed, ref, watch } from 'vue';

import { message, Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createCheckPlanMachinery,
  deleteCheckPlanMachinery,
  getCheckPlanMachineryListByPlan,
} from '#/api/mes/dv/checkplan/machinery';
import { $t } from '#/locales';
import { DvMachinerySelect } from '#/views/mes/dv/machinery/components';

const props = withDefaults(
  defineProps<{ formType?: FormType; planId: number; planType?: number }>(),
  { formType: 'update', planType: undefined },
);
const isEditable = computed(() => props.formType !== 'detail');
const formOpen = ref(false);
const formLoading = ref(false);
const list = ref<MesDvCheckPlanMachineryApi.CheckPlanMachinery[]>([]);

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
      fieldName: 'planId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'machineryId',
      label: '设备',
      component: DvMachinerySelect,
      componentProps: {
        placeholder: '请选择设备',
      },
      rules: 'selectRequired',
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
      { field: 'machineryCode', title: '设备编码', minWidth: 140 },
      { field: 'machineryName', title: '设备名称', minWidth: 150 },
      { field: 'machineryBrand', title: '品牌', minWidth: 120 },
      { field: 'machinerySpecification', title: '规格型号', minWidth: 140 },
      { field: 'remark', title: '备注', minWidth: 140 },
      {
        title: '操作',
        width: 90,
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
  } as VxeTableGridOptions<MesDvCheckPlanMachineryApi.CheckPlanMachinery>,
});

/** 加载点检设备列表 */
async function getList() {
  gridApi.setLoading(true);
  try {
    list.value = await getCheckPlanMachineryListByPlan(props.planId);
    gridApi.setGridOptions({ data: list.value });
  } finally {
    gridApi.setLoading(false);
  }
}

/** 打开点检设备表单 */
async function openForm() {
  formOpen.value = true;
  await formApi.resetForm();
  await formApi.setValues({ planId: props.planId });
}

/** 提交点检设备表单 */
async function submitForm() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  formLoading.value = true;
  try {
    await createCheckPlanMachinery(
      (await formApi.getValues()) as MesDvCheckPlanMachineryApi.CheckPlanMachinery,
    );
    formOpen.value = false;
    message.success($t('ui.actionMessage.operationSuccess'));
    await getList();
  } finally {
    formLoading.value = false;
  }
}

/** 删除点检设备 */
async function handleDelete(id: number) {
  await deleteCheckPlanMachinery(id);
  message.success($t('ui.actionMessage.deleteSuccess', ['设备']));
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
      <TableAction :actions="[{ label: '添加设备', type: 'primary', onClick: openForm }]" />
    </div>
    <Grid class="w-full">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '删除',
              type: 'link',
              danger: true,
              popConfirm: {
                title: '确认删除该设备吗？',
                confirm: handleDelete.bind(null, row.id!),
              },
            },
          ]"
        />
      </template>
    </Grid>
    <Modal
      v-model:open="formOpen"
      title="添加设备"
      width="520px"
      :confirm-loading="formLoading"
      @ok="submitForm"
    >
      <Form class="mx-4" />
    </Modal>
  </div>
</template>
