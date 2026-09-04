<script lang="ts" setup>
import type { SalaryOptionTab } from './data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import {
  Button,
  Dropdown,
  Menu,
  message,
  Switch,
  Tabs,
  Tag,
} from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSalaryOption,
  getSalaryOptionList,
  syncSalaryOption,
  updateSalaryOptionEnabled,
  updateSalaryOptionVisible,
} from '#/api/hrm/salary/config/option';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import { HrmSalaryOptionType } from '#/views/hrm/utils/constants';

import {
  filterSalaryOptions,
  getInactiveSalaryStandardOptions,
  isEnterpriseSalaryOption,
  isOptionalSalaryCategory,
  isSalaryOptionCategory,
  isSystemStandardSalaryOption,
  useGridColumns,
} from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'HrmSalaryOption' });

const activeTab = ref<SalaryOptionTab>('enterprise');
const sourceOptions = ref<HrmSalaryOptionApi.SalaryOption[]>([]);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

async function queryOptions() {
  sourceOptions.value = await getSalaryOptionList();
  return filterSalaryOptions(sourceOptions.value, activeTab.value);
}

function getInactiveStandardOptions(category: HrmSalaryOptionApi.SalaryOption) {
  return getInactiveSalaryStandardOptions(sourceOptions.value, category);
}

async function handleUpdateEnabled(option: HrmSalaryOptionApi.SalaryOption) {
  try {
    await updateSalaryOptionEnabled(option.id, option.enabled);
    message.success($t('ui.actionMessage.operationSuccess'));
  } finally {
    await gridApi.query();
  }
}

async function handleUpdateVisible(option: HrmSalaryOptionApi.SalaryOption) {
  try {
    await updateSalaryOptionVisible(option.id, option.visible);
    message.success($t('ui.actionMessage.operationSuccess'));
  } finally {
    await gridApi.query();
  }
}

async function handleSync() {
  await syncSalaryOption();
  message.success($t('ui.actionMessage.operationSuccess'));
  await gridApi.query();
}

async function handleAddOption(
  command: number | string,
  category: HrmSalaryOptionApi.SalaryOption,
) {
  if (command === 'custom') {
    formModalApi.setData({ parentCode: category.code }).open();
    return;
  }
  const option = getInactiveStandardOptions(category).find(
    (item) => item.code === command,
  );
  if (!option) return;
  await updateSalaryOptionEnabled(option.id, true);
  message.success($t('ui.actionMessage.operationSuccess'));
  await gridApi.query();
}

async function handleDelete(option: HrmSalaryOptionApi.SalaryOption) {
  await (option.templateId
    ? updateSalaryOptionEnabled(option.id, false)
    : deleteSalaryOption(option.id));
  message.success($t('ui.actionMessage.operationSuccess'));
  await gridApi.query();
}

async function handleTabChange() {
  gridApi.setGridOptions({ columns: useGridColumns(activeTab.value) });
  await gridApi.query();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(activeTab.value),
    height: 'auto',
    pagerConfig: { enabled: false },
    proxyConfig: { ajax: { query: queryOptions } },
    rowConfig: { keyField: 'code', isHover: true },
    toolbarConfig: { refresh: true },
    treeConfig: {
      parentField: 'parentCode',
      rowField: 'code',
      transform: true,
      expandAll: true,
      reserve: true,
    },
  } as VxeTableGridOptions<HrmSalaryOptionApi.SalaryOption>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【薪资】计薪设置、薪资档案"
        url="https://doc.iocoder.cn/hrm/salary/config/"
      />
    </template>
    <FormModal @success="gridApi.query" />
    <Grid table-title="工资项列表">
      <template #toolbar-actions>
        <Tabs
          v-model:active-key="activeTab"
          class="w-full"
          @change="handleTabChange"
        >
          <Tabs.TabPane key="enterprise" tab="企业可选项" />
          <Tabs.TabPane key="system" tab="系统默认项" />
        </Tabs>
      </template>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '同步标准薪资项',
              type: 'primary',
              auth: ['hrm:salary:option:update'],
              onClick: handleSync,
            },
          ]"
        />
      </template>
      <template #type="{ row }">
        <Tag v-if="isSalaryOptionCategory(row)" color="default">分类</Tag>
        <Tag v-else-if="row.templateId" color="warning">标准项</Tag>
        <Tag v-else>自定义项</Tag>
      </template>
      <template #optionType="{ row }">
        <DictTag
          v-if="
            !isSalaryOptionCategory(row) &&
            row.type !== HrmSalaryOptionType.CALCULATED
          "
          :type="DICT_TYPE.HRM_SALARY_OPTION_TYPE"
          :value="row.type"
        />
        <span v-else>-</span>
      </template>
      <template #tax="{ row }">
        <DictTag
          v-if="!isSalaryOptionCategory(row)"
          :type="DICT_TYPE.HRM_SALARY_YES_NO"
          :value="row.taxEnabled ? 1 : 0"
        />
        <span v-else>-</span>
      </template>
      <template #status="{ row }">
        <Switch
          v-if="activeTab === 'enterprise' && isOptionalSalaryCategory(row)"
          v-model:checked="row.enabled"
          @change="handleUpdateEnabled(row)"
        />
        <Switch
          v-else-if="
            activeTab === 'system' && isSystemStandardSalaryOption(row)
          "
          v-model:checked="row.visible"
          @change="handleUpdateVisible(row)"
        />
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <Dropdown
          v-if="isOptionalSalaryCategory(row) && row.enabled"
          :trigger="['click']"
        >
          <Button v-access:code="['hrm:salary:option:create']" type="link">
            添加薪资项
          </Button>
          <template #overlay>
            <Menu
              @click="({ key }) => handleAddOption(key as string | number, row)"
            >
              <Menu.Item
                v-for="option in getInactiveStandardOptions(row)"
                :key="option.code"
              >
                {{ option.name }}
              </Menu.Item>
              <Menu.Divider v-if="getInactiveStandardOptions(row).length" />
              <Menu.Item key="custom">自定义薪资项</Menu.Item>
            </Menu>
          </template>
        </Dropdown>
        <TableAction
          v-else
          :actions="[
            {
              label: '删除',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['hrm:salary:option:delete'],
              ifShow: isEnterpriseSalaryOption(row),
              popConfirm: {
                title: `确认删除“${row.name}”吗？`,
                confirm: () => handleDelete(row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
