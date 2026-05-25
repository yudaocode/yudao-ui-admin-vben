<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvRepairLineApi } from '#/api/mes/dv/repair/line';

import { computed, ref, watch } from 'vue';

import { message, Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createRepairLine,
  deleteRepairLine,
  getRepairLine,
  getRepairLinePage,
  updateRepairLine,
} from '#/api/mes/dv/repair/line';
import { $t } from '#/locales';
import { DvSubjectSelect } from '#/views/mes/dv/subject/components';

const props = defineProps<{ disabled?: boolean; repairId: number }>();
const formOpen = ref(false);
const formLoading = ref(false);
const lineFormType = ref<'create' | 'update'>('create');
const formTitle = computed(() =>
  lineFormType.value === 'create' ? '添加维修项目' : '修改维修项目',
);

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
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'repairId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'subjectId',
      label: '项目',
      component: DvSubjectSelect,
      componentProps: {
        placeholder: '请选择项目',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'malfunction',
      label: '故障描述',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入故障描述',
        rows: 3,
      },
      rules: 'required',
    },
    {
      fieldName: 'malfunctionUrl',
      label: '故障图片',
      component: 'Input',
      componentProps: {
        placeholder: '请输入故障图片 URL',
      },
    },
    {
      fieldName: 'description',
      label: '维修描述',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入维修描述',
        rows: 3,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 2,
      },
    },
  ],
  showDefaultActions: false,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'subjectName', title: '项目名称', minWidth: 150 },
      { field: 'subjectContent', title: '项目内容', minWidth: 160 },
      { field: 'subjectStandard', title: '项目标准', minWidth: 160 },
      { field: 'malfunction', title: '故障描述', minWidth: 180 },
      { field: 'malfunctionUrl', title: '故障图片', minWidth: 180 },
      { field: 'description', title: '维修描述', minWidth: 180 },
      {
        title: '操作',
        width: 130,
        fixed: 'right',
        slots: {
          default: 'actions',
        },
        visible: !props.disabled,
      },
    ],
    height: 320,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) =>
          await getRepairLinePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            repairId: props.repairId,
          }),
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
    },
  } as VxeTableGridOptions<MesDvRepairLineApi.RepairLine>,
});

/** 打开维修明细表单 */
async function openForm(type: 'create' | 'update', row?: MesDvRepairLineApi.RepairLine) {
  formOpen.value = true;
  lineFormType.value = type;
  await formApi.resetForm();
  await formApi.setValues(
    row
      ? await getRepairLine(row.id!)
      : {
          repairId: props.repairId,
          malfunction: '',
          malfunctionUrl: '',
          description: '',
          remark: '',
        },
  );
}

/** 提交维修明细表单 */
async function submitForm() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  formLoading.value = true;
  try {
    const data = (await formApi.getValues()) as MesDvRepairLineApi.RepairLine;
    await (data.id ? updateRepairLine(data) : createRepairLine(data));
    formOpen.value = false;
    message.success($t('ui.actionMessage.operationSuccess'));
    await gridApi.query();
  } finally {
    formLoading.value = false;
  }
}

/** 删除维修明细 */
async function handleDelete(id: number) {
  await deleteRepairLine(id);
  message.success($t('ui.actionMessage.deleteSuccess', ['维修项目']));
  await gridApi.query();
}
watch(
  () => props.repairId,
  (value) => {
    if (value) {
      gridApi.query();
    }
  },
);
</script>
<template>
  <div class="mx-4 mt-4">
    <div v-if="!disabled" class="mb-3">
      <TableAction
        :actions="[
          { label: '添加维修项目', type: 'primary', onClick: openForm.bind(null, 'create') },
        ]"
      />
    </div>
    <Grid table-title="维修项目明细">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            { label: '编辑', type: 'link', onClick: openForm.bind(null, 'update', row) },
            {
              label: '删除',
              type: 'link',
              danger: true,
              popConfirm: {
                title: '确认删除该维修项目吗？',
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
      width="620px"
      :confirm-loading="formLoading"
      @ok="submitForm"
    >
      <Form class="mx-4" />
    </Modal>
  </div>
</template>
