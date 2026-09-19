<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaVehicleApplyApi } from '#/api/oa/vehicle/apply';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { ElLoading, ElMessage, ElTag } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelVehicleApply,
  deleteVehicleApply,
  getVehicleApplyPage,
  submitVehicleApply,
} from '#/api/oa/vehicle/apply';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import { router } from '#/router';
import { OA_VEHICLE_RETURN_STATUS } from '#/views/oa/utils/constants';

import ReturnForm from '../return/modules/form.vue';
import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'OaVehicleApply' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

const [ReturnFormModal, returnFormModalApi] = useVbenModal({
  connectedComponent: ReturnForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建用车申请 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑用车申请草稿 */
function handleEdit(row: OaVehicleApplyApi.VehicleApply) {
  formModalApi.setData({ id: row.id }).open();
}

/** 查看用车申请详情 */
function handleDetail(row: OaVehicleApplyApi.VehicleApply) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 审批进度 */
function handleProcessDetail(row: OaVehicleApplyApi.VehicleApply) {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: row.processInstanceId },
  });
}

/** 发起还车 */
function handleReturn(row: OaVehicleApplyApi.VehicleApply) {
  returnFormModalApi.setData({ applyId: row.id }).open();
}

/** 保存还车草稿后进入还车列表继续提交 */
function handleReturnSuccess() {
  router.push('/oa/vehicle/return');
}

/** 删除用车申请草稿 */
async function handleDelete(row: OaVehicleApplyApi.VehicleApply) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.id]),
  });
  try {
    await deleteVehicleApply(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 提交用车申请 */
async function handleSubmit(row: OaVehicleApplyApi.VehicleApply) {
  const loadingInstance = ElLoading.service({
    text: '正在提交中...',
  });
  try {
    await submitVehicleApply(row.id!);
    ElMessage.success('提交成功');
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 取消用车申请 */
async function handleCancel(row: OaVehicleApplyApi.VehicleApply) {
  const loadingInstance = ElLoading.service({
    text: '正在取消中...',
  });
  try {
    await cancelVehicleApply(row.id!);
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
          return await getVehicleApplyPage({
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
  } as VxeTableGridOptions<OaVehicleApplyApi.VehicleApply>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="【行政】会议室、车辆管理" url="https://doc.iocoder.cn/oa/administration/meeting-vehicle/" />
    <FormModal @success="handleRefresh" />
    <DetailModal />
    <ReturnFormModal @success="handleReturnSuccess" />

    <Grid table-title="用车申请列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['用车申请']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:vehicle-apply:create'],
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
      <template #returnStatusTag="{ row }">
        <ElTag
          :type="
            row.returnStatus === OA_VEHICLE_RETURN_STATUS.RETURNED
              ? 'success'
              : 'info'
          "
        >
          {{ getDictLabel(DICT_TYPE.OA_VEHICLE_RETURN_STATUS, row.returnStatus) }}
        </ElTag>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '进度',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['oa:vehicle-apply:query'],
              ifShow: !!row.processInstanceId,
              onClick: handleProcessDetail.bind(null, row),
            },
            {
              label: '还车',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.ADD,
              auth: ['oa:vehicle-return:create'],
              ifShow:
                row.status === BpmProcessInstanceStatus.APPROVE &&
                row.returnStatus === OA_VEHICLE_RETURN_STATUS.PENDING_RETURN,
              onClick: handleReturn.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['oa:vehicle-apply:update'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '提交',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['oa:vehicle-apply:create'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              popConfirm: {
                title: '确认提交用车申请？',
                confirm: handleSubmit.bind(null, row),
              },
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:vehicle-apply:delete'],
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
              auth: ['oa:vehicle-apply:update'],
              ifShow: row.status === BpmProcessInstanceStatus.RUNNING,
              popConfirm: {
                title: '确认取消用车申请？',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
