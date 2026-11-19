<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiDramaTaskApi } from '#/api/ai/drama/task';
import type { AiModelModelApi } from '#/api/ai/model/model';

import { ref } from 'vue';

import { confirm } from '@vben/common-ui';
import {
  AiDramaStatusEnum,
  DICT_TYPE,
  isAiDramaRunning,
} from '@vben/constants';

import { message, Tag } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getDramaTaskPage,
  resubmitDramaTask,
  syncDramaTask,
  updateDramaTaskFail,
} from '#/api/ai/drama/task';
import { getModelSimpleList } from '#/api/ai/model/model';
import { DictTag } from '#/components/dict-tag';

import {
  COMPOSE_TASK_TYPE,
  STORYBOARD_TASK_TYPE,
  useTaskGridColumns,
  useTaskGridFormSchema,
} from '../task-data';

/** AI 短剧制作管理：生成任务（出图、镜头视频、成片合成） */
defineOptions({ name: 'AiDramaTaskList' });

type TaskAction = 'resubmit' | 'sync' | 'updateFail';

/** 任务操作：重新提交、同步状态、标记失败 */
const ACTIONS = {
  resubmit: { text: '重新提交', api: resubmitDramaTask },
  sync: { text: '同步状态', api: syncDramaTask },
  updateFail: { text: '标记失败', api: updateDramaTaskFail },
};

const models = ref<AiModelModelApi.Model[]>([]); // 模型列表，用于展示模型名
const modelsPromise = getModelSimpleList()
  .then((data) => {
    models.value = data;
  })
  .catch(() => {}); // 模型列表加载完成

/** 获得模型名 */
function getModelName(modelId?: number) {
  if (!modelId) {
    return '-';
  }
  return models.value.find((item) => item.id === modelId)?.name || modelId;
}

/** 转存中、生成中的镜头视频可同步 */
function isSyncable(status: number) {
  return (
    status === AiDramaStatusEnum.IN_PROGRESS ||
    status === AiDramaStatusEnum.SAVING
  );
}

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 任务操作：重新提交、同步状态、标记失败 */
async function handleAction(action: TaskAction, row: AiDramaTaskApi.Task) {
  const { text, api } = ACTIONS[action];
  // 成片合成没有保存原来的镜头选择、画幅、旁白、水印：明确告知按什么重新合成
  const tip =
    action === 'resubmit' && row.type === COMPOSE_TASK_TYPE
      ? '将使用全部已完成的镜头、项目画幅与转场重新合成，不含旁白和水印，可能与原合成不同。'
      : '';
  try {
    await confirm(`${tip}确认要"${text}"该任务吗?`);
  } catch {
    return;
  }
  await api(row.type, row.id);
  message.success(`${text}成功`);
  handleRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useTaskGridFormSchema(),
  },
  gridOptions: {
    columns: useTaskGridColumns(getModelName),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          await modelsPromise;
          const data = await getDramaTaskPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
          // 不同类型的任务编号会重复，行主键拼上类型
          return {
            ...data,
            list: data.list.map((item) => ({
              ...item,
              rowKey: `${item.type}-${item.id}`,
            })),
          };
        },
      },
    },
    rowConfig: {
      keyField: 'rowKey',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<AiDramaTaskApi.Task>,
});
</script>

<template>
  <div class="h-full">
    <Grid table-title="生成任务列表">
      <template #status="{ row }">
        <DictTag :type="DICT_TYPE.AI_DRAMA_STATUS" :value="row.status" />
        <Tag v-if="row.timeout" color="error" class="ml-1">超时</Tag>
      </template>
      <template #resultUrl="{ row }">
        <a
          v-if="row.resultUrl"
          :href="row.resultUrl"
          target="_blank"
          class="text-primary"
        >
          查看
        </a>
        <span v-else>-</span>
      </template>
      <template #errorMessage="{ row }">
        <span v-if="row.status === AiDramaStatusEnum.FAIL" class="text-red-500">
          {{ row.errorMessage || '-' }}
        </span>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '重新提交',
              type: 'link',
              auth: ['ai:drama:task'],
              ifShow: row.status === AiDramaStatusEnum.FAIL,
              onClick: handleAction.bind(null, 'resubmit', row),
            },
            {
              label: '同步状态',
              type: 'link',
              auth: ['ai:drama:task'],
              ifShow:
                row.type === STORYBOARD_TASK_TYPE && isSyncable(row.status),
              onClick: handleAction.bind(null, 'sync', row),
            },
            {
              label: '标记失败',
              type: 'link',
              danger: true,
              auth: ['ai:drama:task'],
              ifShow: isAiDramaRunning(row.status),
              onClick: handleAction.bind(null, 'updateFail', row),
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
