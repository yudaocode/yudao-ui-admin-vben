<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProWorkOrderApi } from '#/api/mes/pro/workorder';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import {
  MesProWorkOrderStatusEnum,
  MesProWorkOrderTypeEnum,
} from '@vben/constants';

import { ElButton, ElCard } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getGanttTaskList } from '#/api/mes/pro/task';
import { getWorkOrderPage } from '#/api/mes/pro/workorder';

import { GanttChart } from './components';
import { useGridColumns, useGridFormSchema } from './data';
import ScheduleForm from './modules/schedule-form.vue';

const router = useRouter();
const ganttTasks = ref<any[]>([]); // 甘特图预览数据

const [ScheduleModal, scheduleModalApi] = useVbenModal({
  connectedComponent: ScheduleForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
  loadGanttPreview();
}

/** 加载甘特图预览数据 */
async function loadGanttPreview() {
  ganttTasks.value = await getGanttTaskList({
    status: MesProWorkOrderStatusEnum.CONFIRMED,
    type: MesProWorkOrderTypeEnum.SELF,
  });
}

/** 查看工单详情 */
function handleDetail(row: MesProWorkOrderApi.WorkOrder) {
  scheduleModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 排产 */
function handleSchedule(row: MesProWorkOrderApi.WorkOrder) {
  scheduleModalApi.setData({ formType: 'schedule', id: row.id }).open();
}

/** 打开甘特图编辑页面 */
function handleGanttEdit() {
  router.push({ name: 'MesProTaskGanttEdit' });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getWorkOrderPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            status: MesProWorkOrderStatusEnum.CONFIRMED,
            type: MesProWorkOrderTypeEnum.SELF,
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
    treeConfig: {
      parentField: 'parentId',
      rowField: 'id',
      transform: true,
      expandAll: true,
      reserve: true,
    },
  } as VxeTableGridOptions<MesProWorkOrderApi.WorkOrder>,
});

onMounted(loadGanttPreview);
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【生产】生产排产、工序流转卡"
        url="https://doc.iocoder.cn/mes/pro/schedule-card/"
      />
    </template>

    <ScheduleModal @success="handleRefresh" />

    <!-- 排产甘特图预览 -->
    <ElCard class="mb-4" header="排产甘特图">
      <GanttChart :height="350" :readonly="true" :tasks="ganttTasks" />
    </ElCard>

    <Grid table-title="待排产工单">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '甘特图编辑',
              type: 'primary',
              icon: ACTION_ICON.EDIT,
              onClick: handleGanttEdit,
            },
          ]"
        />
      </template>
      <template #code="{ row }">
        <ElButton link type="primary" @click="handleDetail(row)">
          {{ row.code }}
        </ElButton>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '排产',
              type: 'primary',
              link: true,
              auth: ['mes:pro-task:create'],
              ifShow: row.status === MesProWorkOrderStatusEnum.CONFIRMED,
              onClick: handleSchedule.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
