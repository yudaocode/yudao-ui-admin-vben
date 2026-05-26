<script lang="ts" setup>
import type { FormType } from '../data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesCalTeamMemberApi } from '#/api/mes/cal/team/member';

import { computed, ref, watch } from 'vue';

import { ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMemberListByTeam,
} from '#/api/mes/cal/team/member';
import { getSimpleUserList } from '#/api/system/user';
import { $t } from '#/locales';

const props = withDefaults(defineProps<{ formType?: FormType; teamId: number }>(), {
  formType: 'update',
});
const isEditable = computed(() => ['create', 'update'].includes(props.formType)); // 是否可编辑
const formOpen = ref(false); // 成员表单是否打开
const formLoading = ref(false); // 成员表单提交中
const list = ref<MesCalTeamMemberApi.TeamMember[]>([]); // 成员列表

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
      fieldName: 'teamId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'userId',
      label: '用户',
      component: 'ApiSelect',
      componentProps: {
        clearable: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择用户',
        showSearch: true,
        valueField: 'id',
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
      { field: 'userId', title: '用户编号', width: 100 },
      { field: 'nickname', title: '用户昵称', minWidth: 120 },
      { field: 'telephone', title: '手机号', minWidth: 120 },
      { field: 'remark', title: '备注', minWidth: 160 },
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
  } as VxeTableGridOptions<MesCalTeamMemberApi.TeamMember>,
});

/** 加载成员列表 */
async function getList() {
  gridApi.setLoading(true);
  try {
    list.value = await getTeamMemberListByTeam(props.teamId);
    gridApi.setGridOptions({ data: list.value });
  } finally {
    gridApi.setLoading(false);
  }
}

/** 打开成员表单 */
async function openForm() {
  formOpen.value = true;
  await formApi.resetForm();
  await formApi.setValues({ teamId: props.teamId });
}

/** 提交成员表单 */
async function submitForm() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  formLoading.value = true;
  try {
    const data = (await formApi.getValues()) as MesCalTeamMemberApi.TeamMember;
    await createTeamMember(data);
    formOpen.value = false;
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    await getList();
  } finally {
    formLoading.value = false;
  }
}

/** 删除成员 */
async function handleDelete(id: number) {
  await deleteTeamMember(id);
  ElMessage.success($t('ui.actionMessage.deleteSuccess', ['成员']));
  await getList();
}

watch(
  () => props.teamId,
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
      <TableAction :actions="[{ label: '添加成员', type: 'primary', onClick: openForm }]" />
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
                title: '确认删除该成员吗？',
                confirm: handleDelete.bind(null, row.id!),
              },
            },
          ]"
        />
      </template>
    </Grid>

    <ElDialog v-model="formOpen" title="添加成员" width="520px">
      <Form class="mx-4" />
      <template #footer>
        <ElButton @click="formOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="formLoading" @click="submitForm">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>
