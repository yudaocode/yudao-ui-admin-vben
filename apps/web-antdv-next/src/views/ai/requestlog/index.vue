<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiRequestLogApi } from '#/api/ai/requestlog';

import { ref } from 'vue';

import { DocAlert, Page, useVbenDrawer } from '@vben/common-ui';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getRequestLogPage } from '#/api/ai/requestlog';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Statistics from './modules/statistics.vue';

defineOptions({ name: 'AiRequestLog' });

const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: Detail,
  destroyOnClose: true,
});

const statisticsRef = ref<InstanceType<typeof Statistics>>(); // 统计组件

/** 查看详情 */
function handleDetail(row: AiRequestLogApi.RequestLog) {
  detailDrawerApi.setData({ id: row.id }).open();
}

const [Grid] = useVbenVxeGrid({
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
          // 统计与分页使用同一份筛选条件
          const params = { ...formValues };
          statisticsRef.value?.getStatistics(params);
          return await getRequestLogPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...params,
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
  } as VxeTableGridOptions<AiRequestLogApi.RequestLog>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="AI 手册" url="https://doc.iocoder.cn/ai/build/" />
    </template>

    <DetailDrawer />
    <div class="flex h-full flex-col">
      <!-- 统计 -->
      <Statistics ref="statisticsRef" />

      <!-- 列表 -->
      <div class="min-h-0 flex-1">
        <Grid table-title="AI 请求日志列表">
          <template #actions="{ row }">
            <TableAction
              :actions="[
                {
                  label: $t('common.detail'),
                  type: 'link',
                  icon: ACTION_ICON.VIEW,
                  auth: ['ai:request-log:query'],
                  onClick: handleDetail.bind(null, row),
                },
              ]"
            />
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
