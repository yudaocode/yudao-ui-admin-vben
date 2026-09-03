<script lang="ts" setup>
import type { PmsWorkItemConfiguration } from './data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { Button } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { PmsWorkItemConfigurationOptions } from '#/views/pms/pm/utils/constants';
import WorkItemStatusList from '#/views/pms/pm/workitem/status/status-list.vue';

import { useCollaborationConfigColumns } from './data';

defineOptions({ name: 'PmsProjectCollaborationConfig' });

// TODO @AI：操作列用 TableAction，不要手写 Button。connectedComponent 补 destroyOnClose。
const props = defineProps<{ projectId: number; projectType: number }>();

const configurationList = computed(() =>
  PmsWorkItemConfigurationOptions.filter((option) =>
    option.projectTypes.some(
      (projectType) => projectType === props.projectType,
    ),
  ).map((option) => {
    const name = getDictLabel(DICT_TYPE.PMS_WORK_ITEM_TYPE, option.type) || '-';
    return {
      ...option,
      name,
      projectTypeName: option.projectTypes
        .map((projectType) =>
          getDictLabel(DICT_TYPE.PMS_PROJECT_TYPE, projectType),
        )
        .join('、'),
      description: `配置${name}的状态流转和看板分组。`,
    };
  }),
); // 当前项目可配置的事项类型

const [WorkItemStatusListModal, workItemStatusListModalApi] = useVbenModal({
  connectedComponent: WorkItemStatusList,
});

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: useCollaborationConfigColumns(),
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          const list = configurationList.value;
          return { list, total: list.length };
        },
      },
    },
    rowConfig: {
      keyField: 'type',
      isHover: true,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<PmsWorkItemConfiguration>,
});

/** 打开事项状态设置 */
function openStatusList(row: PmsWorkItemConfiguration) {
  workItemStatusListModalApi
    .setData({ projectId: props.projectId, type: row.type })
    .open();
}
</script>

<template>
  <div>
    <!-- 协作配置列表 -->
    <Grid>
      <template #action="{ row }">
        <Button
          v-access:code="['pms:pm:work-item:update']"
          type="link"
          @click="openStatusList(row)"
        >
          状态设置
        </Button>
      </template>
    </Grid>

    <!-- 工作项状态设置 -->
    <WorkItemStatusListModal />
  </div>
</template>
