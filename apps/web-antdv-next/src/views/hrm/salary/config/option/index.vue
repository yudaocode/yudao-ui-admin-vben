<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';

import { computed, ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { handleTree } from '@vben/utils';

import {
  Button,
  Card,
  Dropdown,
  Menu,
  message,
  Switch,
  Table,
  TabPane,
  Tabs,
  Tag,
} from 'antdv-next';

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

import Form from './modules/form.vue';

defineOptions({ name: 'HrmSalaryOption' });

const loading = ref(false);
const activeTab = ref('enterprise');
const list = ref<HrmSalaryOptionApi.SalaryOption[]>([]);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const enterpriseOptionList = computed(() =>
  list.value
    .filter((item) => !item.systemFlag)
    .map((item) => ({
      ...item,
      children: item.enabled
        ? (item.children || []).filter((child) => child.enabled)
        : [],
    })),
);

const systemOptionList = computed(() =>
  list.value.filter((item) => item.systemFlag),
);

const activeList = computed(() =>
  activeTab.value === 'enterprise'
    ? enterpriseOptionList.value
    : systemOptionList.value,
);

const columns = computed<TableColumnsType<HrmSalaryOptionApi.SalaryOption>>(
  () => {
    const items: TableColumnsType<HrmSalaryOptionApi.SalaryOption> = [
      { title: '薪资项', dataIndex: 'name', key: 'name' },
      { title: '类型', key: 'typeLabel', width: 100 },
      { title: '加减类型', key: 'optionType', width: 100 },
      { title: '计税', key: 'taxEnabled', width: 90 },
      {
        title: activeTab.value === 'enterprise' ? '分类状态' : '显示状态',
        key: 'switch',
        width: 100,
      },
      { title: '备注', dataIndex: 'remark', key: 'remark' },
    ];
    if (activeTab.value === 'enterprise') {
      items.push({ title: '操作', key: 'actions', width: 150 });
    }
    return items;
  },
);

function isCategory(option: HrmSalaryOptionApi.SalaryOption) {
  return !option.parentCode;
}

function isOptionalCategory(option: HrmSalaryOptionApi.SalaryOption) {
  return isCategory(option) && !!option.templateId && !option.systemFlag;
}

function isEnterpriseOption(option: HrmSalaryOptionApi.SalaryOption) {
  return !isCategory(option) && !option.systemFlag;
}

function isSystemStandardOption(option: HrmSalaryOptionApi.SalaryOption) {
  return !isCategory(option) && !!option.templateId && option.systemFlag;
}

function getInactiveStandardOptions(category: HrmSalaryOptionApi.SalaryOption) {
  const source = list.value.find((item) => item.id === category.id);
  return (source?.children || []).filter(
    (item) => item.templateId && !item.enabled,
  );
}

async function getList() {
  loading.value = true;
  try {
    const data = await getSalaryOptionList();
    list.value = handleTree(
      data,
      'code',
      'parentCode',
    ) as HrmSalaryOptionApi.SalaryOption[];
  } finally {
    loading.value = false;
  }
}

async function handleUpdateEnabled(option: HrmSalaryOptionApi.SalaryOption) {
  try {
    await updateSalaryOptionEnabled(option.id, option.enabled);
    message.success($t('ui.actionMessage.operationSuccess'));
    await getList();
  } catch {
    await getList();
  }
}

async function handleUpdateVisible(option: HrmSalaryOptionApi.SalaryOption) {
  try {
    await updateSalaryOptionVisible(option.id, option.visible);
    message.success($t('ui.actionMessage.operationSuccess'));
    await getList();
  } catch {
    await getList();
  }
}

async function handleSync() {
  await syncSalaryOption();
  message.success($t('ui.actionMessage.operationSuccess'));
  await getList();
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
  await getList();
}

async function handleDelete(option: HrmSalaryOptionApi.SalaryOption) {
  await confirm('确认删除该工资项吗？');
  await (option.templateId
    ? updateSalaryOptionEnabled(option.id, false)
    : deleteSalaryOption(option.id));
  message.success($t('ui.actionMessage.operationSuccess'));
  await getList();
}

getList();
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【薪资】计薪设置、薪资档案"
        url="https://doc.iocoder.cn/hrm/salary/config/"
      />
    </template>
    <FormModal @success="getList" />
    <Card>
      <div class="mb-4 flex items-start justify-between">
        <Tabs v-model:active-key="activeTab" class="flex-1">
          <TabPane key="enterprise" tab="企业可选项" />
          <TabPane key="system" tab="系统默认项" />
        </Tabs>
        <Button
          v-access:code="['hrm:salary:option:update']"
          class="ml-4"
          @click="handleSync"
        >
          同步标准薪资项
        </Button>
      </div>
      <Table
        :columns="columns"
        :data-source="activeList"
        :default-expand-all-rows="true"
        :loading="loading"
        :pagination="false"
        :row-key="(row) => row.id"
        children-column-name="children"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'typeLabel'">
            <Tag v-if="isCategory(record)" color="default">分类</Tag>
            <Tag v-else-if="record.templateId" color="warning">标准项</Tag>
            <Tag v-else>自定义项</Tag>
          </template>
          <template v-else-if="column.key === 'optionType'">
            <DictTag
              v-if="
                !isCategory(record) &&
                record.type !== HrmSalaryOptionType.CALCULATED
              "
              :type="DICT_TYPE.HRM_SALARY_OPTION_TYPE"
              :value="record.type"
            />
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'taxEnabled'">
            <DictTag
              v-if="!isCategory(record)"
              :type="DICT_TYPE.HRM_SALARY_YES_NO"
              :value="record.taxEnabled ? 1 : 0"
            />
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'switch'">
            <Switch
              v-if="activeTab === 'enterprise' && isOptionalCategory(record)"
              v-model:checked="record.enabled"
              @change="handleUpdateEnabled(record)"
            />
            <Switch
              v-else-if="
                activeTab === 'system' && isSystemStandardOption(record)
              "
              v-model:checked="record.visible"
              @change="handleUpdateVisible(record)"
            />
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <template v-if="isOptionalCategory(record)">
              <Dropdown v-if="record.enabled" :trigger="['click']">
                <Button
                  v-access:code="['hrm:salary:option:create']"
                  type="link"
                >
                  添加薪资项
                </Button>
                <template #popupRender>
                  <Menu
                    @click="
                      ({ key }) =>
                        handleAddOption(key as string | number, record)
                    "
                  >
                    <Menu.Item
                      v-for="option in getInactiveStandardOptions(record)"
                      :key="option.code"
                    >
                      {{ option.name }}
                    </Menu.Item>
                    <Menu.Divider
                      v-if="getInactiveStandardOptions(record).length"
                    />
                    <Menu.Item key="custom">自定义薪资项</Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
              <span v-else>-</span>
            </template>
            <Button
              v-else-if="isEnterpriseOption(record)"
              v-access:code="['hrm:salary:option:delete']"
              danger
              type="link"
              @click="handleDelete(record)"
            >
              删除
            </Button>
            <span v-else>-</span>
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>
