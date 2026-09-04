<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmEmployeeContractApi } from '#/api/hrm/employee/contract';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getFileNameFromUrl, openWindow } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteEmployeeContract,
  getEmployeeContractList,
} from '#/api/hrm/employee/contract';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';

import { useContractGridColumns } from '../data';
import ContractForm from './contract-form.vue';

const props = defineProps<{ employeeId: number }>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ContractForm,
  destroyOnClose: true,
});

function openForm(row?: HrmEmployeeContractApi.EmployeeContract) {
  formModalApi.setData({ employeeId: props.employeeId, row }).open();
}

async function handleDelete(row: HrmEmployeeContractApi.EmployeeContract) {
  if (!row.id) return;
  await deleteEmployeeContract(row.id);
  message.success($t('ui.actionMessage.deleteSuccess'));
  await gridApi.query();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useContractGridColumns(),
    minHeight: 220,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: () => getEmployeeContractList(props.employeeId),
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<HrmEmployeeContractApi.EmployeeContract>,
});
</script>

<template>
  <div class="w-full">
    <Grid table-title="合同列表">
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
      <template #expireRemind="{ row }">
        <DictTag
          v-if="row.expireRemind !== null"
          :type="DICT_TYPE.INFRA_BOOLEAN_STRING"
          :value="row.expireRemind"
        />
        <span v-else>-</span>
      </template>
      <template #files="{ row }">
        <div v-if="row.fileUrls?.length" class="flex flex-col items-start">
          <Button
            v-for="url in row.fileUrls"
            :key="url"
            type="link"
            class="!h-auto !px-0"
            @click="openWindow(url)"
          >
            {{ getFileNameFromUrl(url) }}
          </Button>
        </div>
        <span v-else>-</span>
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
