<script lang="ts" setup>
import type { FormType } from '../data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvCheckPlanSubjectApi } from '#/api/mes/dv/checkplan/subject';

import { computed, ref, watch } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createCheckPlanSubject,
  deleteCheckPlanSubject,
  getCheckPlanSubjectListByPlan,
} from '#/api/mes/dv/checkplan/subject';
import { $t } from '#/locales';
import { DvSubjectSelect } from '#/views/mes/dv/subject/components';

const props = withDefaults(
  defineProps<{ formType?: FormType; planId: number; planType?: number }>(),
  { formType: 'update', planType: undefined },
);
const isEditable = computed(() => props.formType !== 'detail');
const formOpen = ref(false);
const formLoading = ref(false);
const list = ref<MesDvCheckPlanSubjectApi.CheckPlanSubject[]>([]);

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
      fieldName: 'subjectId',
      label: '项目',
      component: DvSubjectSelect,
      componentProps: {
        type: props.planType,
        placeholder: '请选择项目',
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
      { field: 'subjectCode', title: '项目编码', minWidth: 140 },
      { field: 'subjectName', title: '项目名称', minWidth: 150 },
      {
        field: 'subjectType',
        title: '项目类型',
        width: 120,
        cellRender: {
          name: 'CellDict',
          props: { type: DICT_TYPE.MES_DV_SUBJECT_TYPE },
        },
      },
      { field: 'subjectContent', title: '项目内容', minWidth: 160 },
      { field: 'subjectStandard', title: '标准', minWidth: 160 },
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
  } as VxeTableGridOptions<MesDvCheckPlanSubjectApi.CheckPlanSubject>,
});

/** 加载点检项目列表 */
async function getList() {
  gridApi.setLoading(true);
  try {
    list.value = await getCheckPlanSubjectListByPlan(props.planId);
    gridApi.setGridOptions({ data: list.value });
  } finally {
    gridApi.setLoading(false);
  }
}

/** 打开点检项目表单 */
async function openForm() {
  formOpen.value = true;
  await formApi.resetForm();
  await formApi.setValues({ planId: props.planId });
}

/** 提交点检项目表单 */
async function submitForm() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  formLoading.value = true;
  try {
    await createCheckPlanSubject(
      (await formApi.getValues()) as MesDvCheckPlanSubjectApi.CheckPlanSubject,
    );
    formOpen.value = false;
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    await getList();
  } finally {
    formLoading.value = false;
  }
}

/** 删除点检项目 */
async function handleDelete(id: number) {
  await deleteCheckPlanSubject(id);
  ElMessage.success($t('ui.actionMessage.deleteSuccess', ['项目']));
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
      <TableAction :actions="[{ label: '添加项目', type: 'primary', onClick: openForm }]" />
    </div>
    <Grid class="w-full">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '删除',
              type: 'danger',
              link: true,
              popConfirm: {
                title: '确认删除该项目吗？',
                confirm: handleDelete.bind(null, row.id!),
              },
            },
          ]"
        />
      </template>
    </Grid>
    <ElDialog v-model="formOpen" title="添加项目" width="520px">
      <Form class="mx-4" />
      <template #footer>
        <ElButton @click="formOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="formLoading" @click="submitForm">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>
