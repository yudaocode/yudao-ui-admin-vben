<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RuleSceneApi } from '#/api/iot/rule/scene';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { CommonStatusEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Card, Col, message, Row, Tag, Tooltip } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSceneRule,
  getSceneRulePage,
  updateSceneRuleStatus,
} from '#/api/iot/rule/scene';
import { $t } from '#/locales';
import { CronUtils } from '#/utils/cron';
import {
  getActionTypeLabel,
  getTriggerTypeLabel,
  IotRuleSceneActionTypeEnum,
  IotRuleSceneTriggerTypeEnum,
} from '#/views/iot/utils/constants';

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
  const hideLoading = message.loading({
    content:
      newStatus === CommonStatusEnum.ENABLE ? '正在启用...' : '正在停用...',
    duration: 0,
  });
  try {
    await updateSceneRuleStatus(row.id as number, newStatus);
    message.success({
      content: newStatus === CommonStatusEnum.ENABLE ? '启用成功' : '停用成功',
    });
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 删除场景规则 */
async function handleDelete(row: RuleSceneApi.SceneRule) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteSceneRule(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
    });
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 判断规则是否包含定时触发器 */
function hasTimerTrigger(row: RuleSceneApi.SceneRule): boolean {
  return (
    row.triggers?.some(
      (trigger) =>
        trigger.type === IotRuleSceneTriggerTypeEnum.TIMER,
    ) || false
  );
}

/** 触发器列表项（用于列内多 tag 渲染） */
interface TriggerCellItem {
  color: string;
  label: string;
  meta?: string;
}

/** 动作列表项 */
interface ActionCellItem {
  color: string;
  label: string;
  meta?: string;
}

/** 触发器 → tag 颜色（按 5 种类型区分） */
function colorOfTrigger(type?: number): string {
  switch (type) {
    case IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST: {
      return 'orange';
    }
    case IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST: {
      return 'blue';
    }
    case IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE: {
      return 'purple';
    }
    case IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE: {
      return 'cyan';
    }
    case IotRuleSceneTriggerTypeEnum.TIMER: {
      return 'gold';
    }
    default: {
      return 'default';
    }
  }
}

/** 动作 → tag 颜色（按 4 种类型区分） */
function colorOfAction(type?: number): string {
  switch (type) {
    case IotRuleSceneActionTypeEnum.ALERT_RECOVER: {
      return 'green';
    }
    case IotRuleSceneActionTypeEnum.ALERT_TRIGGER: {
      return 'red';
    }
    case IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET: {
      return 'blue';
    }
    case IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE: {
      return 'purple';
    }
    default: {
      return 'default';
    }
  }
}

/** 触发器列：每个触发器一项 */
function getTriggerCellItems(row: RuleSceneApi.SceneRule): TriggerCellItem[] {
  if (!row.triggers?.length) {
    return [];
  }
  return row.triggers.map((trigger) => {
    const type = trigger.type ?? 0;
    let label = getTriggerTypeLabel(type);
    if (
      (type === IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST ||
        type === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST ||
        type === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE) &&
      trigger.identifier
    ) {
      label += ` · ${trigger.identifier}`;
    } else if (type === IotRuleSceneTriggerTypeEnum.TIMER) {
      label += ` · ${CronUtils.format(trigger.cronExpression || '')}`;
    }
    const meta = trigger.deviceId
      ? `设备 #${trigger.deviceId}`
      : (trigger.productId
        ? `产品 #${trigger.productId}`
        : '');
    return { color: colorOfTrigger(type), label, meta };
  });
}

/** 动作列：每个动作一项 */
function getActionCellItems(row: RuleSceneApi.SceneRule): ActionCellItem[] {
  if (!row.actions?.length) {
    return [];
  }
  return row.actions.map((action) => {
    const type = action.type ?? 0;
    const label = getActionTypeLabel(type);
    const meta = action.deviceId
      ? `设备 #${action.deviceId}`
      : action.productId
        ? `产品 #${action.productId}`
        : action.alertConfigId
          ? `告警 #${action.alertConfigId}`
          : '';
    return { color: colorOfAction(type), label, meta };
  });
}

/** 取定时触发器的 CRON 频率描述 */
function getCronFrequency(row: RuleSceneApi.SceneRule): string {
  const timerTrigger = row.triggers?.find(
    (trigger) =>
      trigger.type === IotRuleSceneTriggerTypeEnum.TIMER,
  );
  return timerTrigger?.cronExpression
    ? CronUtils.getFrequencyDescription(timerTrigger.cronExpression)
    : '';
}

/** 取定时触发器原始 CRON 表达式 */
function getCronExpression(row: RuleSceneApi.SceneRule): string {
  const timerTrigger = row.triggers?.find(
    (trigger) =>
      trigger.type === IotRuleSceneTriggerTypeEnum.TIMER,
  );
  return timerTrigger?.cronExpression || '';
}

/** 取定时触发器下次执行时间 */
function getNextExecutionTime(row: RuleSceneApi.SceneRule): Date | null {
  const timerTrigger = row.triggers?.find(
    (trigger) =>
      trigger.type === IotRuleSceneTriggerTypeEnum.TIMER,
  );
  return timerTrigger?.cronExpression
    ? CronUtils.getNextExecutionTime(timerTrigger.cronExpression)
    : null;
}

/** 基于当前页列表刷新统计数据 */
function updateStatistics(rows: RuleSceneApi.SceneRule[]) {
  statistics.value = {
    total: rows.length,
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
          updateStatistics(result.list || []);
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
    <Row :gutter="16" class="mb-4">
      <Col :span="6">
        <Card :body-style="{ padding: '12px 16px' }">
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
              <div class="text-xs text-secondary">总规则数</div>
            </div>
          </div>
        </Card>
      </Col>
      <Col :span="6">
        <Card :body-style="{ padding: '12px 16px' }">
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
              <div class="text-xs text-secondary">启用规则</div>
            </div>
          </div>
        </Card>
      </Col>
      <Col :span="6">
        <Card :body-style="{ padding: '12px 16px' }">
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
              <div class="text-xs text-secondary">禁用规则</div>
            </div>
          </div>
        </Card>
      </Col>
      <Col :span="6">
        <Card :body-style="{ padding: '12px 16px' }">
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
              <div class="text-xs text-secondary">定时规则</div>
            </div>
          </div>
        </Card>
      </Col>
    </Row>

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
      <!-- 规则名称列：名称 + 状态 + 描述 -->
      <template #name="{ row }">
        <div class="gap-2 flex items-center">
          <span class="font-medium">{{ row.name }}</span>
        </div>
        <Tooltip
          v-if="row.description"
          :title="row.description"
          placement="top"
        >
          <div class="text-xs text-secondary mt-1 truncate max-w-[160px]">
            {{ row.description }}
          </div>
        </Tooltip>
      </template>
      <!-- 触发条件列：按触发器各显示一项 -->
      <template #triggers="{ row }">
        <div v-if="getTriggerCellItems(row).length > 0" class="flex flex-col gap-1">
          <div
            v-for="(item, i) in getTriggerCellItems(row)"
            :key="`trigger-${i}`"
            class="flex items-center gap-1"
          >
            <Tag :color="item.color" class="m-0">{{ item.label }}</Tag>
            <span v-if="item.meta" class="text-xs text-secondary">
              {{ item.meta }}
            </span>
          </div>
          <Tooltip
            v-if="hasTimerTrigger(row)"
            :title="getCronExpression(row)"
            placement="top"
          >
            <span class="text-xs text-secondary">
              <IconifyIcon icon="lucide:clock" class="mr-1 inline" />
              {{ getCronFrequency(row) }}
              <template v-if="getNextExecutionTime(row)">
                · 下次 {{ formatDateTime(getNextExecutionTime(row) as Date) }}
              </template>
            </span>
          </Tooltip>
        </div>
        <span v-else class="text-xs text-secondary">无触发器</span>
      </template>
      <!-- 执行动作列：按动作各显示一项 -->
      <template #actionsCol="{ row }">
        <div v-if="getActionCellItems(row).length > 0" class="flex flex-col gap-1">
          <div
            v-for="(item, i) in getActionCellItems(row)"
            :key="`action-${i}`"
            class="flex items-center gap-1"
          >
            <Tag :color="item.color" class="m-0">{{ item.label }}</Tag>
            <span v-if="item.meta" class="text-xs text-secondary">
              {{ item.meta }}
            </span>
          </div>
        </div>
        <span v-else class="text-xs text-secondary">无动作</span>
      </template>
      <template #actions="{ row }">
        <!-- TODO @AI：1）枚举；2）有没必要，对齐别的模块的开启、禁用 -->
        <TableAction
          :actions="[
            {
              label: row.status === 0 ? '停用' : '启用',
              type: 'link',
              icon:
                row.status === 0
                  ? 'ant-design:stop-outlined'
                  : 'ant-design:check-circle-outlined',
              onClick: handleToggleStatus.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
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
