<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaVehicleReturnApi } from '#/api/oa/vehicle/return';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';

import { ElLoading, ElMessage, ElTag } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelVehicleReturn,
  deleteVehicleReturn,
  getVehicleReturnPage,
  submitVehicleReturn,
} from '#/api/oa/vehicle/return';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import { router } from '#/router';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'OaVehicleReturn' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建还车申请 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑还车申请草稿 */
function handleEdit(row: OaVehicleReturnApi.VehicleReturn) {
  formModalApi.setData({ id: row.id }).open();
}

/** 查看还车申请详情 */
function handleDetail(row: OaVehicleReturnApi.VehicleReturn) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 审批进度 */
function handleProcessDetail(row: OaVehicleReturnApi.VehicleReturn) {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: row.processInstanceId },
  });
}

/** 删除还车申请草稿 */
async function handleDelete(row: OaVehicleReturnApi.VehicleReturn) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.id]),
  });
  try {
    await deleteVehicleReturn(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 提交还车申请 */
async function handleSubmit(row: OaVehicleReturnApi.VehicleReturn) {
  const loadingInstance = ElLoading.service({
    text: '正在提交中...',
  });
  try {
    await submitVehicleReturn(row.id!);
    ElMessage.success('提交成功');
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 取消还车申请 */
async function handleCancel(row: OaVehicleReturnApi.VehicleReturn) {
  const loadingInstance = ElLoading.service({
    text: '正在取消中...',
  });
  try {
    await cancelVehicleReturn(row.id!);
    ElMessage.success('取消成功');
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getVehicleReturnPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<OaVehicleReturnApi.VehicleReturn>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="【行政】会议室、车辆管理" url="https://doc.iocoder.cn/oa/administration/meeting-vehicle/" />
    <FormModal @success="handleRefresh" />
    <DetailModal />

    <Grid table-title="还车申请列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['还车申请']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:vehicle-return:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #no="{ row }">
        <span class="cursor-pointer text-primary" @click="handleDetail(row)">
          {{ row.no }}
        </span>
      </template>
      <template #statusTag="{ row }">
        <ElTag
          v-if="row.status === BpmProcessInstanceStatus.NOT_START"
          type="info"
        >
          未提交
        </ElTag>
        <DictTag
          v-else
          :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
          :value="row.status"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '进度',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['oa:vehicle-return:query'],
              ifShow: !!row.processInstanceId,
              onClick: handleProcessDetail.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['oa:vehicle-return:update'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '提交',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['oa:vehicle-return:create'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              popConfirm: {
                title: '确认提交还车申请？',
                confirm: handleSubmit.bind(null, row),
              },
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:vehicle-return:delete'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.id]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '取消',
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:vehicle-return:update'],
              ifShow: row.status === BpmProcessInstanceStatus.RUNNING,
              popConfirm: {
                title: '确认取消还车申请？',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
