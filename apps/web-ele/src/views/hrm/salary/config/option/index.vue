<script lang="ts" setup>
import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';

import { computed, ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { handleTree } from '@vben/utils';

import { ElMessage } from 'element-plus';

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
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    await getList();
  } catch {
    await getList();
  }
}

async function handleUpdateVisible(option: HrmSalaryOptionApi.SalaryOption) {
  try {
    await updateSalaryOptionVisible(option.id, option.visible);
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    await getList();
  } catch {
    await getList();
  }
}

async function handleSync() {
  await syncSalaryOption();
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
  await getList();
}

async function handleDelete(option: HrmSalaryOptionApi.SalaryOption) {
  await confirm('确认删除该工资项吗？');
  await (option.templateId
    ? updateSalaryOptionEnabled(option.id, false)
    : deleteSalaryOption(option.id));
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
    <ElCard>
      <div class="mb-4 flex items-start justify-between">
        <ElTabs v-model="activeTab" class="flex-1">
          <ElTabPane label="企业可选项" name="enterprise" />
          <ElTabPane label="系统默认项" name="system" />
        </ElTabs>
        <ElButton
          v-access:code="['hrm:salary:option:update']"
          class="ml-4"
          @click="handleSync"
        >
          同步标准薪资项
        </ElButton>
      </div>
      <ElTable
        v-loading="loading"
        border
        :data="activeList"
        default-expand-all
        row-key="id"
      >
        <ElTableColumn label="薪资项" prop="name" />
        <ElTableColumn label="类型" width="100">
          <template #default="{ row }">
            <ElTag v-if="isCategory(row)" type="info">分类</ElTag>
            <ElTag v-else-if="row.templateId" type="warning">标准项</ElTag>
            <ElTag v-else>自定义项</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="加减类型" width="100">
          <template #default="{ row }">
            <DictTag
              v-if="
                !isCategory(row) && row.type !== HrmSalaryOptionType.CALCULATED
              "
              :type="DICT_TYPE.HRM_SALARY_OPTION_TYPE"
              :value="row.type"
            />
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="计税" width="90">
          <template #default="{ row }">
            <DictTag
              v-if="!isCategory(row)"
              :type="DICT_TYPE.HRM_SALARY_YES_NO"
              :value="row.taxEnabled ? 1 : 0"
            />
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn
          :label="activeTab === 'enterprise' ? '分类状态' : '显示状态'"
          width="100"
        >
          <template #default="{ row }">
            <ElSwitch
              v-if="activeTab === 'enterprise' && isOptionalCategory(row)"
              v-model="row.enabled"
              @change="handleUpdateEnabled(row)"
            />
            <ElSwitch
              v-else-if="activeTab === 'system' && isSystemStandardOption(row)"
              v-model="row.visible"
              @change="handleUpdateVisible(row)"
            />
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="备注" prop="remark" />
        <ElTableColumn
          v-if="activeTab === 'enterprise'"
          label="操作"
          width="150"
        >
          <template #default="{ row }">
            <template v-if="isOptionalCategory(row)">
              <ElDropdown v-if="row.enabled" trigger="click">
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
                    <ElDivider v-if="getInactiveStandardOptions(row).length" />
                    <ElDropdownItem @click="handleAddOption('custom', row)">
                      自定义薪资项
                    </ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
              <span v-else>-</span>
            </template>
            <ElButton
              v-else-if="isEnterpriseOption(row)"
              v-access:code="['hrm:salary:option:delete']"
              link
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </ElButton>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>
  </Page>
</template>
