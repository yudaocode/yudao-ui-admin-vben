<script lang="ts" setup>
import type { PageParam } from '@vben/request';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElMessage,
  ElMessageBox,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelEmployeeQuit,
  deleteEmployee,
  deleteEmployeeList,
  exportEmployee,
  getEmployeePage,
  getEmployeeStatusCount,
  sendEmployeeProfileFillMessage,
} from '#/api/hrm/employee';
import { $t } from '#/locales';
import {
  HrmEmployeeEntryStatus,
  HrmEmployeeStatus,
  HrmEmployeeStatusTab,
  HrmEmployeeSurveyType,
  HrmEmployeeTodoType,
} from '#/views/hrm/utils/constants';

import {
  getEmployeeStatusTabItems,
  useGridColumns,
  useGridFormSchema,
} from './data';
import CreateFromUserForm from './modules/create-from-user-form.vue';
import Form from './modules/form.vue';
import FullTimeForm from './modules/full-time-form.vue';
import ImportForm from './modules/import-form.vue';
import InsuranceSchemeForm from './modules/insurance-scheme-form.vue';
import PositionChangeForm from './modules/position-change-form.vue';
import QuitForm from './modules/quit-form.vue';
import RegularForm from './modules/regular-form.vue';

defineOptions({ name: 'HrmEmployee' });

const router = useRouter();
const { push } = router;
const route = useRoute();
const employeePath = route.path;
const { hasAccessByCodes } = useAccess();

const activeStatus = ref(String(HrmEmployeeStatusTab.FULL_TIME));
const statusCounts = ref<HrmEmployeeApi.StatusCount[]>([]);
const checkedIds = ref<number[]>([]);
const checkedEmployees = ref<HrmEmployeeApi.Employee[]>([]);
const exportLoading = ref(false);
const batchDeleteLoading = ref(false);

const entryTotal = ref(0);
const isEntrySurvey = computed(
  () => Number(route.query.surveyType) === HrmEmployeeSurveyType.ENTRY,
);
const statusCategory = computed(() =>
  activeStatus.value === 'entry' ? undefined : Number(activeStatus.value),
);

const statusTabOptions = computed(() => {
  const countMap = Object.fromEntries(
    statusCounts.value.map((item) => [item.status, item.count]),
  );
  const items = getEmployeeStatusTabItems().map((item) => ({
    label: item.label,
    value: String(item.status),
    count: countMap[item.status] ?? 0,
  }));
  if (isEntrySurvey.value) {
    items.unshift({
      label: '本月入职',
      value: 'entry',
      count: entryTotal.value,
    });
  }
  return items;
});

const hasBatchPermission = computed(
  () =>
    hasAccessByCodes(['hrm:insurance:employee-info:update']) ||
    hasAccessByCodes(['hrm:employee:delete']) ||
    hasAccessByCodes(['hrm:employee:update']),
);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const [CreateFromUserModal, createFromUserModalApi] = useVbenModal({
  connectedComponent: CreateFromUserForm,
  destroyOnClose: true,
});
const [ImportModal, importModalApi] = useVbenModal({
  connectedComponent: ImportForm,
  destroyOnClose: true,
});
const [RegularModal, regularModalApi] = useVbenModal({
  connectedComponent: RegularForm,
  destroyOnClose: true,
});
/** 调岗 / 晋升 / 降级共用一个弹窗，通过 mode 区分 */
const [PositionChangeModal, positionChangeModalApi] = useVbenModal({
  connectedComponent: PositionChangeForm,
  destroyOnClose: true,
});
const [FullTimeModal, fullTimeModalApi] = useVbenModal({
  connectedComponent: FullTimeForm,
  destroyOnClose: true,
});
const [QuitModal, quitModalApi] = useVbenModal({
  connectedComponent: QuitForm,
  destroyOnClose: true,
});
const [InsuranceSchemeModal, insuranceSchemeModalApi] = useVbenModal({
  connectedComponent: InsuranceSchemeForm,
  destroyOnClose: true,
});

function isEmployeeInsuranceEligible(employee: HrmEmployeeApi.Employee) {
  return (
    (employee.status === HrmEmployeeStatus.REGULAR ||
      employee.status === HrmEmployeeStatus.PROBATION) &&
    employee.entryStatus !== HrmEmployeeEntryStatus.LEFT
  );
}

async function handleRefresh() {
  checkedIds.value = [];
  checkedEmployees.value = [];
  await gridApi.reload();
}

/** 首页来源筛选同时用于列表、统计与导出 */
function getHomeFilters() {
  const leaderEmployeeId = Number(route.query.leaderEmployeeId);
  const todoType = Number(route.query.todoType);
  const surveyType = Number(route.query.surveyType);
  return {
    leaderEmployeeId:
      Number.isSafeInteger(leaderEmployeeId) && leaderEmployeeId > 0
        ? leaderEmployeeId
        : undefined,
    todoType: (Object.values(HrmEmployeeTodoType) as number[]).includes(
      todoType,
    )
      ? todoType
      : undefined,
    surveyType: (Object.values(HrmEmployeeSurveyType) as number[]).includes(
      surveyType,
    )
      ? surveyType
      : undefined,
  };
}

/** 普通状态页签清除首页来源筛选，并同步地址栏 */
async function handleStatusTabChange(key: number | string) {
  if (key === 'entry') {
    return;
  }
  activeStatus.value = String(key);
  if (
    route.query.statusCategory === String(key) &&
    !route.query.surveyType &&
    !route.query.todoType
  ) {
    await handleRefresh();
    return;
  }
  await router.replace({
    query: {
      ...route.query,
      statusCategory: String(key),
      surveyType: undefined,
      todoType: undefined,
    },
  });
}

function handleCreate() {
  formModalApi.setData({ type: 'create' }).open();
}

function openForm(type: string, id?: number) {
  formModalApi.setData({ type, id }).open();
}

function handleDetail(id?: number) {
  if (!id) return;
  push({ name: 'HrmEmployeeDetail', params: { id } });
}

function getEmployeeMoreActions(employee: HrmEmployeeApi.Employee) {
  const actions: Array<{ command: string; label: string }> = [];
  if (
    hasAccessByCodes(['hrm:insurance:employee-info:update']) &&
    isEmployeeInsuranceEligible(employee)
  ) {
    actions.push({ command: 'insurance-scheme', label: '设置参保方案' });
  }
  if (hasAccessByCodes(['hrm:employee:update'])) {
    if (employee.entryStatus === HrmEmployeeEntryStatus.PENDING_ENTRY) {
      actions.push({ command: 'confirm-entry', label: '确认入职' });
    } else if (employee.entryStatus === HrmEmployeeEntryStatus.LEFT) {
      actions.push(
        { command: 'rehire', label: '办理再入职' },
        { command: 'quit', label: '修改离职信息' },
      );
    } else if (
      employee.entryStatus === HrmEmployeeEntryStatus.ACTIVE ||
      employee.entryStatus === HrmEmployeeEntryStatus.PENDING_LEAVE
    ) {
      if (employee.status === HrmEmployeeStatus.PROBATION) {
        actions.push({ command: 'regular', label: '办理转正' });
      }
      actions.push(
        { command: 'transfer', label: '调整部门/岗位' },
        { command: 'promotion', label: '晋升' },
        { command: 'demotion', label: '降级' },
      );
      if (
        employee.status === HrmEmployeeStatus.INTERN ||
        employee.status === HrmEmployeeStatus.PART_TIME
      ) {
        actions.push({ command: 'full-time', label: '转为全职' });
      }
      if (employee.entryStatus === HrmEmployeeEntryStatus.ACTIVE) {
        actions.push({ command: 'quit', label: '办理离职' });
      } else {
        actions.push({ command: 'cancel-quit', label: '取消离职' });
      }
    }
  }
  if (hasAccessByCodes(['hrm:employee:delete'])) {
    actions.push({ command: 'delete', label: '删除' });
  }
  return actions;
}

async function handleMoreCommand(
  command: string,
  employee: HrmEmployeeApi.Employee,
) {
  if (!employee.id) return;
  if (command === 'insurance-scheme') {
    insuranceSchemeModalApi.setData([employee.id]).open();
    return;
  }
  if (command === 'regular') {
    regularModalApi.setData(employee).open();
    return;
  }
  if (command === 'transfer') {
    positionChangeModalApi.setData({ employee, mode: 'transfer' }).open();
    return;
  }
  if (command === 'promotion') {
    positionChangeModalApi.setData({ employee, mode: 'promote' }).open();
    return;
  }
  if (command === 'demotion') {
    positionChangeModalApi.setData({ employee, mode: 'demote' }).open();
    return;
  }
  if (command === 'full-time') {
    fullTimeModalApi.setData(employee).open();
    return;
  }
  if (command === 'confirm-entry') return openForm('confirm', employee.id);
  if (command === 'rehire') return openForm('rehire', employee.id);
  if (command === 'quit') {
    quitModalApi.setData(employee).open();
    return;
  }
  if (command === 'cancel-quit') {
    try {
      const { value } = await ElMessageBox.prompt(
        `请输入取消员工“${employee.name}”离职安排的原因`,
        '取消离职',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputType: 'textarea',
          inputPlaceholder: '请输入取消原因',
          inputValidator: (input) => !!input?.trim() || '取消原因不能为空',
        },
      );
      await cancelEmployeeQuit({
        employeeId: employee.id!,
        reason: value.trim(),
      });
      ElMessage.success('已取消离职');
      await handleRefresh();
    } catch {}
    return;
  }
  if (command === 'delete') {
    await handleDelete(employee.id);
  }
}

async function handleDelete(id: number) {
  try {
    await confirm($t('ui.actionMessage.deleteConfirm'));
    await deleteEmployee(id);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    await handleRefresh();
  } catch {}
}

async function handleExport() {
  try {
    await confirm('是否确认导出员工档案数据？');
  } catch {
    return;
  }
  exportLoading.value = true;
  try {
    const formValues = await gridApi.formApi.getValues();
    const data = await exportEmployee({
      pageNo: 1,
      pageSize: 100,
      ...formValues,
      ...getHomeFilters(),
      statusCategory: statusCategory.value,
    } as PageParam);
    downloadFileFromBlobPart({ fileName: '员工档案.xlsx', source: data });
  } finally {
    exportLoading.value = false;
  }
}

async function handleBatchDelete() {
  if (checkedIds.value.length === 0) return;
  try {
    await confirm(
      `确定删除选中的 ${checkedIds.value.length} 份员工档案吗？已绑定的后台账号及历史业务记录将保留。`,
    );
    batchDeleteLoading.value = true;
    await deleteEmployeeList(checkedIds.value);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    await handleRefresh();
  } catch {
    //
  } finally {
    batchDeleteLoading.value = false;
  }
}

async function handleSendArchiveFillMessage() {
  if (checkedIds.value.length === 0) return;
  try {
    await confirm(
      `确定向选中的 ${checkedIds.value.length} 名员工发送填写档案通知吗？`,
    );
    const result = await sendEmployeeProfileFillMessage([...checkedIds.value]);
    ElMessage.success(
      `通知发送完成：成功 ${result.successCount} 人，跳过 ${result.skippedCount} 人，失败 ${result.failureCount} 人`,
    );
  } catch {}
}

async function handleBatchCommand(command: string) {
  if (command === 'insurance-scheme') {
    const eligible = checkedEmployees.value.filter(isEmployeeInsuranceEligible);
    if (eligible.length !== checkedEmployees.value.length) {
      ElMessage.warning('只能为正式或试用且未离职的员工设置参保方案');
      return;
    }
    insuranceSchemeModalApi.setData(eligible.map((item) => item.id!)).open();
    return;
  }
  if (command === 'delete') {
    await handleBatchDelete();
    return;
  }
  if (command === 'send-profile-fill-message') {
    await handleSendArchiveFillMessage();
  }
}

function getBatchDropDownActions() {
  const actions: Array<{
    danger?: boolean;
    label: string;
    onClick?: () => void;
  }> = [];
  if (hasAccessByCodes(['hrm:insurance:employee-info:update'])) {
    actions.push({
      label: '设置参保方案',
      onClick: () => handleBatchCommand('insurance-scheme'),
    });
  }
  if (hasAccessByCodes(['hrm:employee:delete'])) {
    actions.push({
      label: '批量删除',
      danger: true,
      onClick: () => handleBatchCommand('delete'),
    });
  }
  if (hasAccessByCodes(['hrm:employee:update'])) {
    actions.push({
      label: '发送填写档案通知',
      onClick: () => handleBatchCommand('send-profile-fill-message'),
    });
  }
  return actions;
}

function getRowActions(row: HrmEmployeeApi.Employee) {
  return [
    {
      label: $t('common.edit'),
      type: 'primary' as const,
      link: true,
      icon: ACTION_ICON.EDIT,
      auth: ['hrm:employee:update'],
      onClick: () => openForm('update', row.id),
    },
  ];
}

function getRowDropDownActions(row: HrmEmployeeApi.Employee) {
  return getEmployeeMoreActions(row).map((action) => ({
    label: action.label,
    auth: [] as string[],
    danger: action.command === 'delete',
    ...(action.command === 'delete'
      ? {
          popConfirm: {
            title: $t('ui.actionMessage.deleteConfirm', [row.name]),
            confirm: () => handleMoreCommand(action.command, row),
          },
        }
      : { onClick: () => handleMoreCommand(action.command, row) }),
  }));
}

function handleRowCheckboxChange({
  records,
}: {
  records: HrmEmployeeApi.Employee[];
}) {
  checkedEmployees.value = records;
  checkedIds.value = records.map((item) => item.id!);
}

function applyHomeFilter() {
  const routeCategory = Number(route.query.statusCategory);
  let category = getEmployeeStatusTabItems().some(
    (item) => item.status === routeCategory,
  )
    ? routeCategory
    : HrmEmployeeStatusTab.FULL_TIME;
  const surveyType = Number(route.query.surveyType);
  if (surveyType === HrmEmployeeSurveyType.LEAVE) {
    category = HrmEmployeeStatusTab.LEFT;
  } else if (surveyType === HrmEmployeeSurveyType.PENDING_ENTRY) {
    category = HrmEmployeeStatusTab.PENDING_ENTRY;
  } else if (surveyType === HrmEmployeeSurveyType.PENDING_LEAVE) {
    category = HrmEmployeeStatusTab.PENDING_LEAVE;
  }
  activeStatus.value = isEntrySurvey.value ? 'entry' : String(category);
}

applyHomeFilter();

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    schema: useGridFormSchema(),
    handleReset: async () => {
      await gridApi.formApi.reset();
      gridApi.formApi.setLatestSubmissionValues(
        await gridApi.formApi.getValues(),
      );
      await handleStatusTabChange(HrmEmployeeStatusTab.ACTIVE);
    },
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const filters = { ...formValues, ...getHomeFilters() };
          const [data, counts] = await Promise.all([
            getEmployeePage({
              ...filters,
              pageNo: page.currentPage,
              pageSize: page.pageSize,
              statusCategory: statusCategory.value,
            }),
            getEmployeeStatusCount({
              ...filters,
              // 普通页签展示点击后的人数，本月入职人数由列表 total 展示
              surveyType: isEntrySurvey.value ? undefined : filters.surveyType,
            } as PageParam),
          ]);
          entryTotal.value = data.total;
          statusCounts.value = counts;
          return data;
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<HrmEmployeeApi.Employee>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

/** 缓存页面再次进入、来源条件变化及前进后退时同步列表 */
watch(
  () => [
    route.path,
    route.query.statusCategory,
    route.query.surveyType,
    route.query.todoType,
    route.query.leaderEmployeeId,
  ],
  () => {
    if (route.path !== employeePath) {
      return;
    }
    applyHomeFilter();
    handleRefresh();
  },
);
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【员工】员工管理"
        url="https://doc.iocoder.cn/hrm/employee/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <CreateFromUserModal @success="handleRefresh" />
    <ImportModal @success="handleRefresh" />
    <RegularModal @success="handleRefresh" />
    <PositionChangeModal @success="handleRefresh" />
    <FullTimeModal @success="handleRefresh" />
    <QuitModal @success="handleRefresh" />
    <InsuranceSchemeModal @success="handleRefresh" />

    <Grid class="employee-grid">
      <template #toolbar-actions>
        <div class="employee-status-tabs">
          <ElTabs
            v-model="activeStatus"
            class="w-full"
            @tab-change="handleStatusTabChange"
          >
            <ElTabPane
              v-for="item in statusTabOptions"
              :key="item.value"
              :label="`${item.label}（${item.count}）`"
              :name="item.value"
            />
          </ElTabs>
        </div>
      </template>
      <template #toolbar-tools>
        <div class="flex shrink-0 flex-nowrap items-center gap-2">
          <TableAction
            :actions="[
              {
                label: '新增',
                type: 'primary',
                icon: ACTION_ICON.ADD,
                auth: ['hrm:employee:create'],
                onClick: handleCreate,
              },
              {
                label: '从后台用户建档',
                type: 'primary',
                icon: ACTION_ICON.ADD,
                auth: ['hrm:employee:create'],
                onClick: () => createFromUserModalApi.open(),
              },
              {
                label: '导入',
                type: 'primary',
                icon: ACTION_ICON.UPLOAD,
                auth: ['hrm:employee:import'],
                onClick: () => importModalApi.open(),
              },
              {
                label: '导出',
                type: 'primary',
                icon: ACTION_ICON.DOWNLOAD,
                auth: ['hrm:employee:export'],
                loading: exportLoading,
                onClick: handleExport,
              },
            ]"
          />
          <ElDropdown
            v-if="hasBatchPermission"
            :disabled="checkedIds.length === 0"
            trigger="click"
          >
            <ElButton
              :disabled="checkedIds.length === 0"
              :loading="batchDeleteLoading"
              type="primary"
            >
              批量操作
            </ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem
                  v-for="action in getBatchDropDownActions()"
                  :key="action.label"
                  :style="
                    action.danger
                      ? { color: 'var(--el-color-danger)' }
                      : undefined
                  "
                  @click="action.onClick?.()"
                >
                  {{ action.label }}
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </div>
      </template>
      <template #name="{ row }">
        <ElButton link type="primary" @click="handleDetail(row.id)">
          {{ row.name }}
        </ElButton>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="getRowActions(row)"
          :drop-down-actions="getRowDropDownActions(row)"
        />
      </template>
    </Grid>
  </Page>
</template>

<style scoped>
.employee-grid :deep(.vxe-toolbar) {
  flex-wrap: wrap;
  row-gap: 0;
  align-items: center;
}

.employee-grid :deep(.vxe-buttons--wrapper) {
  flex: 1 0 100%;
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.employee-grid :deep(.vxe-tools--wrapper),
.employee-grid :deep(.vxe-tools--operate) {
  flex: 1 1 auto;
  flex-wrap: nowrap;
  justify-content: flex-end;
  margin-left: auto;
}

.employee-status-tabs {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.employee-status-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.employee-status-tabs :deep(.el-tabs__header::before) {
  border-bottom: none;
}
</style>
