<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmEmployeeEducationExperienceApi } from '#/api/hrm/employee/education-experience';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteEmployeeEducationExperience,
  getEmployeeEducationExperienceList,
} from '#/api/hrm/employee/education-experience';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';

import { useEducationGridColumns } from '../data';
import Form from './education-form.vue';

defineOptions({ name: 'HrmEmployeeEducationList' });

const props = defineProps<{ employeeId: number }>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function openForm(
  row?: HrmEmployeeEducationExperienceApi.EmployeeEducationExperience,
) {
  formModalApi.setData({ employeeId: props.employeeId, row }).open();
}

async function handleDelete(
  row: HrmEmployeeEducationExperienceApi.EmployeeEducationExperience,
) {
  if (!row.id) return;
  await deleteEmployeeEducationExperience(row.id);
  message.success($t('ui.actionMessage.deleteSuccess'));
  await gridApi.query();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useEducationGridColumns(),
    minHeight: 200,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: () => getEmployeeEducationExperienceList(props.employeeId),
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<HrmEmployeeEducationExperienceApi.EmployeeEducationExperience>,
});
</script>

<template>
  <div class="w-full">
    <Grid table-title="教育经历列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['hrm:employee:update'],
              onClick: () => openForm(),
            },
          ]"
        />
      </template>
      <template #education="{ row }">
        <DictTag
          v-if="row.education !== null"
          :type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
          :value="row.education"
        />
        <span v-else>-</span>
      </template>
      <template #firstDegree="{ row }">
        <DictTag
          :type="DICT_TYPE.INFRA_BOOLEAN_STRING"
          :value="row.firstDegree"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['hrm:employee:update'],
              onClick: () => openForm(row),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['hrm:employee:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm'),
                confirm: () => handleDelete(row),
              },
            },
          ]"
        />
      </template>
    </Grid>
    <FormModal @success="gridApi.query" />
  </div>
</template>
