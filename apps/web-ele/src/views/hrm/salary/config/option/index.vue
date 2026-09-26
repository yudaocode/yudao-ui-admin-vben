<script lang="ts" setup>
import type { SalaryOptionTab } from './data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElMessage,
  ElSwitch,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

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
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
  } finally {
    await gridApi.query();
  }
}

async function handleUpdateVisible(option: HrmSalaryOptionApi.SalaryOption) {
  try {
    await updateSalaryOptionVisible(option.id, option.visible);
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
  } finally {
    await gridApi.query();
  }
}

async function handleSync() {
  await syncSalaryOption();
  ElMessage.success(
    '同步完成，已保留启用和显示设置；已移除的标准项可通过「添加薪资项」恢复',
  );
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
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
  await gridApi.query();
}

async function handleDelete(option: HrmSalaryOptionApi.SalaryOption) {
  await (option.templateId
    ? updateSalaryOptionEnabled(option.id, false)
    : deleteSalaryOption(option.id));
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
        <ElTabs v-model="activeTab" class="w-full" @change="handleTabChange">
          <ElTabPane label="企业可选项" name="enterprise" />
          <ElTabPane label="系统默认项" name="system" />
        </ElTabs>
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
        <ElTag v-if="isSalaryOptionCategory(row)" type="info">分类</ElTag>
        <ElTag v-else-if="row.templateId" type="warning">标准项</ElTag>
        <ElTag v-else>自定义项</ElTag>
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
        <ElSwitch
          v-if="activeTab === 'enterprise' && isOptionalSalaryCategory(row)"
          v-model="row.enabled"
          @change="handleUpdateEnabled(row)"
        />
        <ElSwitch
          v-else-if="
            activeTab === 'system' && isSystemStandardSalaryOption(row)
          "
          v-model="row.visible"
          @change="handleUpdateVisible(row)"
        />
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <ElDropdown
          v-if="isOptionalSalaryCategory(row) && row.enabled"
          trigger="click"
        >
          <ElButton
            v-access:code="['hrm:salary:option:create']"
            link
            type="primary"
          >
            添加薪资项
          </ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem
                v-for="option in getInactiveStandardOptions(row)"
                :key="option.code"
                @click="handleAddOption(option.code, row)"
              >
                {{ option.name }}
              </ElDropdownItem>
              <ElDropdownItem divided @click="handleAddOption('custom', row)">
                自定义薪资项
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
        <TableAction
          v-else
          :actions="[
            {
              label: '删除',
              type: 'danger',
              link: true,
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
