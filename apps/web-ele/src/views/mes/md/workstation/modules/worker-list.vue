<script lang="ts" setup>
import type { FormType } from '../data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdWorkstationWorkerApi } from '#/api/mes/md/workstation/worker';

import { computed, ref, watch } from 'vue';

import { ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenForm, z } from '#/adapter/form';
import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createWorkstationWorker,
  deleteWorkstationWorker,
  getWorkstationWorkerList,
  updateWorkstationWorker,
} from '#/api/mes/md/workstation/worker';
import { getSimplePostList } from '#/api/system/post';
import { $t } from '#/locales';

defineOptions({ name: 'MesMdWorkstationWorkerList' });

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
const formOpen = ref(false); // 人力资源表单是否打开
const formLoading = ref(false); // 人力资源表单提交中
const formData = ref<MesMdWorkstationWorkerApi.WorkstationWorker>();
const list = ref<MesMdWorkstationWorkerApi.WorkstationWorker[]>([]); // 人力资源列表

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
      fieldName: 'postId',
      label: '岗位',
      component: 'ApiSelect',
      componentProps: {
        api: getSimplePostList,
        clearable: true,
        labelField: 'name',
        placeholder: '请选择岗位',
        valueField: 'id',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'quantity',
      label: '数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
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
        field: 'postId',
        title: '岗位编号',
        width: 140,
      },
      {
        field: 'postName',
        title: '岗位名称',
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
  } as VxeTableGridOptions<MesMdWorkstationWorkerApi.WorkstationWorker>,
});

/** 加载人力资源列表 */
async function getList() {
  gridApi.setLoading(true);
  try {
    list.value = await getWorkstationWorkerList(props.workstationId);
    gridApi.setGridOptions({ data: list.value });
  } finally {
    gridApi.setLoading(false);
  }
}

/** 打开人力资源表单 */
async function openForm(row?: MesMdWorkstationWorkerApi.WorkstationWorker) {
  formOpen.value = true;
  formData.value = row;
  await formApi.resetForm();
  await formApi.setValues({
    quantity: 1,
    workstationId: props.workstationId,
    ...row,
  });
}

/** 提交人力资源表单 */
async function submitForm() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  formLoading.value = true;
  try {
    const data =
      (await formApi.getValues()) as MesMdWorkstationWorkerApi.WorkstationWorker;
    await (formData.value?.id
      ? updateWorkstationWorker(data)
      : createWorkstationWorker(data));
    formOpen.value = false;
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    await getList();
  } finally {
    formLoading.value = false;
  }
}

/** 删除人力资源 */
async function handleDelete(id: number) {
  await deleteWorkstationWorker(id);
  ElMessage.success($t('ui.actionMessage.deleteSuccess', ['人力资源']));
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
            label: '添加人员',
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
              type: 'primary',
              link: true,
              onClick: openForm.bind(null, row),
            },
            {
              label: '删除',
              type: 'danger',
              link: true,
              popConfirm: {
                title: '确认删除该人力资源吗？',
                confirm: handleDelete.bind(null, row.id!),
              },
            },
          ]"
        />
      </template>
    </Grid>

    <ElDialog
      v-model="formOpen"
      :title="formData?.id ? '编辑人员' : '添加人员'"
      width="520px"
    >
      <Form class="mx-4" />
      <template #footer>
        <ElButton @click="formOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="formLoading" @click="submitForm">
          确定
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>
