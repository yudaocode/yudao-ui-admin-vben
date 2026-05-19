<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IoTOtaTaskApi } from '#/api/iot/ota/task';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { cancelOtaTask, getOtaTaskPage } from '#/api/iot/ota/task';
import { IoTOtaTaskStatusEnum } from '#/views/iot/utils/constants';

import OtaTaskDetail from './detail.vue';
import OtaTaskForm from './form.vue';
import { useGridColumns, useGridFormSchema } from '../data';

/** IoT OTA 任务列表 */
// TODO @AI：defineOptions 还需要么？
defineOptions({ name: 'IoTOtaTaskList' });

const props = defineProps<{
  firmwareId: number;
  productId: number;
}>();

const emit = defineEmits(['success']);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: OtaTaskForm,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: OtaTaskDetail,
  destroyOnClose: true,
});

/** 刷新表格 */
async function handleRefresh() {
  await gridApi.query();
  emit('success');
}

/** 新增任务 */
function handleCreate() {
  formModalApi
    .setData({ firmwareId: props.firmwareId, productId: props.productId })
    .open();
}

/** 查看任务详情 */
function handleDetail(row: IoTOtaTaskApi.Task) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 取消任务 */
async function handleCancel(row: IoTOtaTaskApi.Task) {
  await cancelOtaTask(row.id as number);
  message.success('取消成功');
  await handleRefresh();
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
          return await getOtaTaskPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            firmwareId: props.firmwareId,
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
  } as VxeTableGridOptions<IoTOtaTaskApi.Task>,
});
</script>

<template>
  <!-- TODO @AI：是不是要有个高度？ -->
  <div>
    <FormModal @success="handleRefresh" />
    <DetailModal @success="handleRefresh" />

    <!-- TODO @AI：上面有个【任务名称】，有没可能包在一起，不然太丑了。/Users/yunai/Downloads/iShot_2026-05-19_11.26.04.png -->
    <Grid table-title="升级任务管理">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '详情',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              onClick: handleDetail.bind(null, row),
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              ifShow: row.status === IoTOtaTaskStatusEnum.IN_PROGRESS.value,
              popConfirm: {
                title: '确认要取消该升级任务吗？',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
