<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IoTOtaTaskApi } from '#/api/iot/ota/task';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { cancelOtaTask, getOtaTaskPage } from '#/api/iot/ota/task';
import { IoTOtaTaskStatusEnum } from '#/views/iot/utils/constants';

import { useGridColumns } from '../data';
import OtaTaskDetail from './detail.vue';
import OtaTaskForm from './form.vue';

const props = defineProps<{
  firmwareId: number;
  productId: number;
}>();

const emit = defineEmits(['success']);

const searchName = ref('');

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

/** 按任务名搜索（嵌入页面里，单字段搜索做成 toolbar 内联输入框，回车 / 清空触发查询） */
async function handleSearch() {
  await gridApi.query();
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
  gridOptions: {
    columns: useGridColumns(),
    maxHeight: 500,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getOtaTaskPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            firmwareId: props.firmwareId,
            name: searchName.value || undefined,
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
    },
  } as VxeTableGridOptions<IoTOtaTaskApi.Task>,
});
</script>

<template>
  <div>
    <FormModal @success="handleRefresh" />
    <DetailModal @success="handleRefresh" />

    <Grid table-title="升级任务管理">
      <template #toolbar-tools>
        <div class="flex items-center gap-2">
          <Input
            v-model:value="searchName"
            placeholder="请输入任务名称"
            allow-clear
            style="width: 200px"
            @press-enter="handleSearch"
            @change="(e: any) => !e.target.value && handleSearch()"
          />
          <TableAction
            :actions="[
              {
                label: '搜索',
                type: 'default',
                icon: 'ant-design:search-outlined',
                onClick: handleSearch,
              },
              {
                label: '新增',
                type: 'primary',
                icon: ACTION_ICON.ADD,
                auth: ['iot:ota-task:create'],
                onClick: handleCreate,
              },
            ]"
          />
        </div>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '详情',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['iot:ota-task:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['iot:ota-task:cancel'],
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
