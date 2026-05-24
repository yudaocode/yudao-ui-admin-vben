<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RuleSceneApi } from '#/api/iot/rule/scene';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import {
  CommonStatusEnum,
  DICT_TYPE,
  getActionTypeLabel,
  getTriggerTypeLabel,
  IotRuleSceneTriggerTypeEnum,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { CronUtils, formatDateTime } from '@vben/utils';

import {
  ElCard,
  ElCol,
  ElLoading,
  ElMessage,
  ElRow,
  ElTag,
  ElTooltip,
} from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSceneRule,
  getSceneRulePage,
  updateSceneRuleStatus,
} from '#/api/iot/rule/scene';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const statistics = ref({
  total: 0,
  enabled: 0,
  disabled: 0,
  timerRules: 0,
}); // 统计数据

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建场景规则 */
function handleCreate() {
  formDrawerApi.setData(null).open();
}

/** 编辑场景规则 */
function handleEdit(row: RuleSceneApi.SceneRule) {
  formDrawerApi.setData(row).open();
}

/** 启用/停用场景规则 */
async function handleToggleStatus(row: RuleSceneApi.SceneRule) {
  const newStatus =
    row.status === CommonStatusEnum.ENABLE
      ? CommonStatusEnum.DISABLE
      : CommonStatusEnum.ENABLE;
  const loadingInstance = ElLoading.service({
    text: newStatus === CommonStatusEnum.ENABLE ? '正在启用...' : '正在停用...',
  });
  try {
    await updateSceneRuleStatus(row.id as number, newStatus);
    ElMessage.success(
      newStatus === CommonStatusEnum.ENABLE ? '启用成功' : '停用成功',
    );
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 删除场景规则 */
async function handleDelete(row: RuleSceneApi.SceneRule) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
  });
  try {
    await deleteSceneRule(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 判断规则是否包含定时触发器 */
function hasTimerTrigger(row: RuleSceneApi.SceneRule): boolean {
  return (
    row.triggers?.some(
      (trigger) => trigger.type === IotRuleSceneTriggerTypeEnum.TIMER,
    ) || false
  );
}

/** 触发条件摘要文本（拼接所有触发器） */
function getTriggerSummary(row: RuleSceneApi.SceneRule): string {
  if (!row.triggers?.length) return '无触发器';
  return row.triggers
    .map((trigger) => {
      const type = trigger.type ?? 0;
      let description = getTriggerTypeLabel(type);
      if (
        (type === IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST ||
          type === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST ||
          type === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE) &&
        trigger.identifier
      ) {
        description += ` (${trigger.identifier})`;
      } else if (type === IotRuleSceneTriggerTypeEnum.TIMER) {
        description = `${getTriggerTypeLabel(type)} (${CronUtils.format(trigger.cronExpression || '')})`;
      }
      if (trigger.deviceId) {
        description += ` [设备 ID: ${trigger.deviceId}]`;
      } else if (trigger.productId) {
        description += ` [产品 ID: ${trigger.productId}]`;
      }
      return description;
    })
    .join(', ');
}

/** 执行动作摘要文本（拼接所有动作） */
function getActionSummary(row: RuleSceneApi.SceneRule): string {
  if (!row.actions?.length) return '无执行器';
  return row.actions
    .map((action) => {
      let description = getActionTypeLabel(action.type ?? 0);
      if (action.deviceId) {
        description += ` [设备 ID: ${action.deviceId}]`;
      } else if (action.productId) {
        description += ` [产品 ID: ${action.productId}]`;
      }
      if (action.alertConfigId) {
        description += ` [告警配置 ID: ${action.alertConfigId}]`;
      }
      return description;
    })
    .join(', ');
}

/** 取定时触发器的 CRON 频率描述 */
function getCronFrequency(row: RuleSceneApi.SceneRule): string {
  const timerTrigger = row.triggers?.find(
    (trigger) => trigger.type === IotRuleSceneTriggerTypeEnum.TIMER,
  );
  return timerTrigger?.cronExpression
    ? CronUtils.getFrequencyDescription(timerTrigger.cronExpression)
    : '';
}

/** 取定时触发器原始 CRON 表达式 */
function getCronExpression(row: RuleSceneApi.SceneRule): string {
  const timerTrigger = row.triggers?.find(
    (trigger) => trigger.type === IotRuleSceneTriggerTypeEnum.TIMER,
  );
  return timerTrigger?.cronExpression || '';
}

/** 取定时触发器下次执行时间 */
function getNextExecutionTime(row: RuleSceneApi.SceneRule): Date | null {
  const timerTrigger = row.triggers?.find(
    (trigger) => trigger.type === IotRuleSceneTriggerTypeEnum.TIMER,
  );
  return timerTrigger?.cronExpression
    ? CronUtils.getNextExecutionTime(timerTrigger.cronExpression)
    : null;
}

/** 刷新规则统计卡片数据 */
function updateStatistics(rows: RuleSceneApi.SceneRule[], total?: number) {
  statistics.value = {
    total: total ?? rows.length,
    enabled: rows.filter((item) => item.status === CommonStatusEnum.ENABLE)
      .length,
    disabled: rows.filter((item) => item.status === CommonStatusEnum.DISABLE)
      .length,
    timerRules: rows.filter((item) => hasTimerTrigger(item)).length,
  };
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
          const result = await getSceneRulePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
          updateStatistics(result.list || [], result.total);
          return result;
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
  } as VxeTableGridOptions<RuleSceneApi.SceneRule>,
});
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="handleRefresh" />

    <!-- 统计卡片 -->
    <ElRow :gutter="16" class="mb-4">
      <ElCol :span="6">
        <ElCard body-class="!p-3">
          <div class="flex items-center">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center text-xl text-white mr-3 bg-gradient-to-br from-indigo-500 to-purple-600"
            >
              <IconifyIcon icon="ant-design:file-text-outlined" />
            </div>
            <div class="leading-tight">
              <div class="text-xl font-semibold">
                {{ statistics.total }}
              </div>
              <div class="text-xs text-muted-foreground">总规则数</div>
            </div>
          </div>
        </ElCard>
      </ElCol>
      <ElCol :span="6">
        <ElCard body-class="!p-3">
          <div class="flex items-center">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center text-xl text-white mr-3 bg-gradient-to-br from-pink-400 to-red-500"
            >
              <IconifyIcon icon="ant-design:check-outlined" />
            </div>
            <div class="leading-tight">
              <div class="text-xl font-semibold">
                {{ statistics.enabled }}
              </div>
              <div class="text-xs text-muted-foreground">启用规则</div>
            </div>
          </div>
        </ElCard>
      </ElCol>
      <ElCol :span="6">
        <ElCard body-class="!p-3">
          <div class="flex items-center">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center text-xl text-white mr-3 bg-gradient-to-br from-cyan-400 to-blue-500"
            >
              <IconifyIcon icon="ant-design:close-outlined" />
            </div>
            <div class="leading-tight">
              <div class="text-xl font-semibold">
                {{ statistics.disabled }}
              </div>
              <div class="text-xs text-muted-foreground">禁用规则</div>
            </div>
          </div>
        </ElCard>
      </ElCol>
      <ElCol :span="6">
        <ElCard body-class="!p-3">
          <div class="flex items-center">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center text-xl text-white mr-3 bg-gradient-to-br from-green-400 to-teal-400"
            >
              <IconifyIcon icon="lucide:timer" />
            </div>
            <div class="leading-tight">
              <div class="text-xl font-semibold">
                {{ statistics.timerRules }}
              </div>
              <div class="text-xs text-muted-foreground">定时规则</div>
            </div>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>

    <Grid table-title="场景规则列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['场景规则']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <!-- 规则名称列：名称 + 状态 tag inline + 描述 -->
      <template #name="{ row }">
        <div class="flex items-center gap-2">
          <span class="font-medium text-foreground">{{ row.name }}</span>
          <DictTag :type="DICT_TYPE.COMMON_STATUS" :value="row.status" />
        </div>
        <ElTooltip
          v-if="row.description"
          :content="row.description"
          placement="top"
        >
          <div
            class="mt-1 max-w-[200px] truncate text-xs text-muted-foreground"
          >
            {{ row.description }}
          </div>
        </ElTooltip>
      </template>
      <!-- 触发条件列：单 tag 汇总 + 定时触发额外信息 -->
      <template #triggers="{ row }">
        <div class="space-y-1">
          <ElTag type="primary" class="m-0">{{ getTriggerSummary(row) }}</ElTag>
          <ElTooltip
            v-if="hasTimerTrigger(row)"
            :content="getCronExpression(row)"
            placement="top"
          >
            <div class="text-xs text-muted-foreground">
              <IconifyIcon icon="lucide:clock" class="mr-1 inline" />
              {{ getCronFrequency(row) }}
              <template v-if="getNextExecutionTime(row)">
                · 下次 {{ formatDateTime(getNextExecutionTime(row) as Date) }}
              </template>
            </div>
          </ElTooltip>
        </div>
      </template>
      <!-- 执行动作列：单 tag 汇总 -->
      <template #actionsCol="{ row }">
        <ElTag type="success" class="m-0">{{ getActionSummary(row) }}</ElTag>
      </template>
      <!-- 最近触发列 -->
      <template #lastTriggeredTime="{ row }">
        <span v-if="row.lastTriggeredTime">
          {{ formatDateTime(row.lastTriggeredTime) }}
        </span>
        <span v-else class="text-muted-foreground">未触发</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: row.status === CommonStatusEnum.ENABLE ? '停用' : '启用',
              type: 'primary',
              link: true,
              icon:
                row.status === CommonStatusEnum.ENABLE
                  ? 'ant-design:stop-outlined'
                  : 'ant-design:check-circle-outlined',
              popConfirm: {
                title: `确认${row.status === CommonStatusEnum.ENABLE ? '停用' : '启用'}场景规则「${row.name}」吗？`,
                confirm: handleToggleStatus.bind(null, row),
              },
            },
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
