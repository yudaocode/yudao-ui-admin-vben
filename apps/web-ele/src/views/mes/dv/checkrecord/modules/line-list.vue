<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvCheckRecordLineApi } from '#/api/mes/dv/checkrecord/line';

import { computed, ref, watch } from 'vue';

import { DICT_TYPE, MesDvCheckResultEnum, MesDvSubjectTypeEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createCheckRecordLine,
  deleteCheckRecordLine,
  getCheckRecordLine,
  getCheckRecordLinePage,
  updateCheckRecordLine,
} from '#/api/mes/dv/checkrecord/line';
import { $t } from '#/locales';
import { DvSubjectSelect } from '#/views/mes/dv/subject/components';

const props = defineProps<{ disabled?: boolean; recordId: number }>();
const formOpen = ref(false);
const formLoading = ref(false);
const lineFormType = ref<'create' | 'update'>('create');
const formTitle = computed(() => (lineFormType.value === 'create' ? '添加明细' : '修改明细'));

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
      fieldName: 'recordId',
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
        type: MesDvSubjectTypeEnum.CHECK,
        placeholder: '请选择项目',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'checkStatus',
      label: '结果',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MES_DV_CHECK_RESULT, 'number'),
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'checkResult',
      label: '异常描述',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入异常描述',
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
      {
        field: 'checkStatus',
        title: '结果',
        width: 120,
        cellRender: {
          name: 'CellDict',
          props: { type: DICT_TYPE.MES_DV_CHECK_RESULT },
        },
      },
      { field: 'checkResult', title: '异常描述', minWidth: 160 },
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
          await getCheckRecordLinePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            recordId: props.recordId,
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
  } as VxeTableGridOptions<MesDvCheckRecordLineApi.CheckRecordLine>,
});

/** 打开点检明细表单 */
async function openForm(type: 'create' | 'update', row?: MesDvCheckRecordLineApi.CheckRecordLine) {
  formOpen.value = true;
  lineFormType.value = type;
  await formApi.resetForm();
  await formApi.setValues(
    row
      ? await getCheckRecordLine(row.id!)
      : {
          recordId: props.recordId,
          checkStatus: MesDvCheckResultEnum.NORMAL,
          checkResult: '',
          remark: '',
        },
  );
}

/** 提交点检明细表单 */
async function submitForm() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  formLoading.value = true;
  try {
    const data = (await formApi.getValues()) as MesDvCheckRecordLineApi.CheckRecordLine;
    await (data.id ? updateCheckRecordLine(data) : createCheckRecordLine(data));
    formOpen.value = false;
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    await gridApi.query();
  } finally {
    formLoading.value = false;
  }
}

/** 删除点检明细 */
async function handleDelete(id: number) {
  await deleteCheckRecordLine(id);
  ElMessage.success($t('ui.actionMessage.deleteSuccess', ['明细']));
  await gridApi.query();
}
watch(
  () => props.recordId,
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
        :actions="[{ label: '添加明细', type: 'primary', onClick: openForm.bind(null, 'create') }]"
      />
    </div>
    <Grid table-title="明细列表">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'primary',
              link: true,
              onClick: openForm.bind(null, 'update', row),
            },
            {
              label: '删除',
              type: 'danger',
              link: true,
              popConfirm: {
                title: '确认删除该明细吗？',
                confirm: handleDelete.bind(null, row.id!),
              },
            },
          ]"
        />
      </template>
    </Grid>
    <ElDialog v-model="formOpen" :title="formTitle" width="620px">
      <Form class="mx-4" />
      <template #footer>
        <ElButton @click="formOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="formLoading" @click="submitForm">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>
