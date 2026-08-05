<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformanceAssessmentApi } from '#/api/hrm/performance/assessment';
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { confirm, Page } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, useTabs } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  Dropdown,
  Menu,
  message,
  TabPane,
  Tabs,
  Tag,
} from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getOperateLogPage } from '#/api/hrm/operate-log';
import {
  getPerformanceAssessmentPage,
  removePerformancePlanEmployees,
} from '#/api/hrm/performance/assessment';
import {
  archivePerformancePlan,
  deletePerformancePlan,
  getPerformancePlan,
  getPerformancePlanLevelCount,
  getPerformancePlanStageCount,
  openPerformancePlanScoring,
  startPerformancePlan,
  startPerformancePlanInterview,
  terminatePerformancePlan,
} from '#/api/hrm/performance/plan';
import { OperateLog } from '#/components/operate-log';
import { $t } from '#/locales';
import {
  HrmBizType,
  HrmPerformancePlanStatus,
} from '#/views/hrm/utils/constants';

import AssessmentAddForm from '../modules/assessment-add-form.vue';
import Header from './modules/header.vue';
import Info from './modules/info.vue';

defineOptions({ name: 'HrmPerformancePlanDetail' });

const RESULT_LEVEL_EMPTY_VALUE = '__RESULT_LEVEL_EMPTY__';

const route = useRoute();
const router = useRouter();
const { closeCurrentTab } = useTabs();

const planId = Number(route.params.id);
const loading = ref(false);
const employeeTotal = ref(0);
const activeTab = ref(
  route.query.tab === 'employees' ? 'employees' : 'details',
);
const plan = ref<HrmPerformancePlanApi.PerformancePlan>({ name: '' });
const logList = ref<SystemOperateLogApi.OperateLog[]>([]);
const stageCountList = ref<HrmPerformancePlanApi.PerformanceStageCount[]>([]);
const levelList = ref<string[]>([]);
const checkedEmployeeIds = ref<number[]>([]);
const assessmentAddFormRef = ref<InstanceType<typeof AssessmentAddForm>>();

const isEditable = computed(
  () =>
    plan.value.status === HrmPerformancePlanStatus.DRAFT ||
    plan.value.status === HrmPerformancePlanStatus.NOT_STARTED,
);

const showMoreActions = computed(
  () =>
    isEditable.value || plan.value.status === HrmPerformancePlanStatus.RUNNING,
);

function close() {
  closeCurrentTab();
  router.push({ name: 'HrmPerformancePlan' });
}

function openForm() {
  router.push({
    name: 'HrmPerformancePlanForm',
    query: { type: 'update', id: planId },
  });
}

function openSettings() {
  router.push({
    name: 'HrmPerformancePlanForm',
    query: { type: 'view', id: planId },
  });
}

function openAssessmentDetail(assessmentId?: number) {
  if (!assessmentId) return;
  router.push({
    name: 'HrmPerformanceAssessmentDetail',
    params: { id: assessmentId },
    query: { planId: String(planId) },
  });
}

async function getPlan() {
  loading.value = true;
  try {
    const data = await getPerformancePlan(planId);
    if (!data) {
      close();
      return;
    }
    plan.value = data;
  } finally {
    loading.value = false;
  }
}

async function getOperateLog() {
  const data = await getOperateLogPage({
    bizType: HrmBizType.PERFORMANCE_PLAN,
    bizId: planId,
  });
  logList.value = data.list;
}

async function getEmployeeStatistics() {
  const [stageCounts, levelCounts] = await Promise.all([
    getPerformancePlanStageCount(planId),
    getPerformancePlanLevelCount(planId),
  ]);
  stageCountList.value = stageCounts;
  levelList.value = levelCounts
    .map((item) => item.levelName)
    .filter((levelName): levelName is string => !!levelName);
  employeeGridApi.formApi?.updateSchema?.([
    {
      fieldName: 'resultLevelFilter',
      componentProps: {
        options: buildResultLevelOptions(),
      },
    },
  ]);
}

async function getData() {
  await Promise.all([getPlan(), getEmployeeStatistics(), getOperateLog()]);
  await employeeGridApi.query();
}

async function handleAction(
  action: 'archive' | 'interview' | 'open' | 'start' | 'terminate',
) {
  const actionName = {
    start: '启动计划',
    open: '开启评分',
    interview: '发起绩效面谈',
    archive: '归档计划',
    terminate: '终止计划',
  }[action];
  await confirm(`确认${actionName}？`);
  if (action === 'start') await startPerformancePlan(planId);
  else if (action === 'open') await openPerformancePlanScoring(planId);
  else if (action === 'interview') await startPerformancePlanInterview(planId);
  else if (action === 'archive') await archivePerformancePlan(planId);
  else await terminatePerformancePlan(planId);
  message.success($t('ui.actionMessage.operationSuccess'));
  if (action === 'terminate') {
    close();
    return;
  }
  await getData();
}

async function handleDelete() {
  await confirm('确认删除该 KPI 考核？');
  await deletePerformancePlan(planId);
  message.success($t('ui.actionMessage.deleteSuccess'));
  close();
}

async function handleRemoveEmployees() {
  if (checkedEmployeeIds.value.length === 0) return;
  await confirm(
    `确认移除选中的 ${checkedEmployeeIds.value.length} 名参评员工？`,
  );
  await removePerformancePlanEmployees({
    planId,
    employeeIds: checkedEmployeeIds.value,
  });
  message.success('参评员工移除成功');
  checkedEmployeeIds.value = [];
  await getData();
}

function buildResultLevelOptions() {
  return [
    ...levelList.value.map((level) => ({ label: level, value: level })),
    { label: '未定级', value: RESULT_LEVEL_EMPTY_VALUE },
  ] as VxeTableGridOptions['columns'];
}

function useEmployeeFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'search',
      label: '员工信息',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入姓名、工号或手机号',
      },
    },
    {
      fieldName: 'deptId',
      label: '部门',
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: () =>
          import('#/api/system/dept').then((m) => m.getSimpleDeptList()),
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'employeeType',
      label: '聘用形式',
      component: 'DictSelect',
      componentProps: {
        allowClear: true,
        dictType: DICT_TYPE.HRM_EMPLOYEE_TYPE,
        placeholder: '请选择',
      },
    },
    {
      fieldName: 'employeeStatus',
      label: '员工状态',
      component: 'DictSelect',
      componentProps: {
        allowClear: true,
        dictType: DICT_TYPE.HRM_EMPLOYEE_STATUS,
        placeholder: '请选择',
      },
    },
    {
      fieldName: 'stageType',
      label: '当前阶段',
      component: 'DictSelect',
      componentProps: {
        allowClear: true,
        dictType: DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS,
        placeholder: '请选择',
      },
    },
    {
      fieldName: 'resultLevelFilter',
      label: '结果等级',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: buildResultLevelOptions(),
        placeholder: '请选择',
      },
    },
  ];
}

function useEmployeeColumns(
  isEditableMode: boolean,
): VxeTableGridOptions['columns'] {
  return [
    ...(isEditableMode ? [{ type: 'checkbox' as const, width: 50 }] : []),
    {
      field: 'employeeName',
      title: '员工姓名',
      minWidth: 130,
      slots: { default: 'employeeName' },
    },
    { field: 'jobNumber', title: '工号', minWidth: 120 },
    { field: 'mobile', title: '手机号', minWidth: 130 },
    { field: 'deptName', title: '部门', minWidth: 130 },
    {
      field: 'employeeType',
      title: '聘用形式',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_EMPLOYEE_TYPE },
      },
    },
    {
      field: 'employeeStatus',
      title: '员工状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_EMPLOYEE_STATUS },
      },
    },
    {
      field: 'stageType',
      title: '阶段',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS },
      },
    },
    { field: 'currentHandlerName', title: '当前处理人', minWidth: 120 },
    { field: 'score', title: '分数', width: 90, align: 'center' },
    { field: 'resultLevel', title: '等级', width: 90, align: 'center' },
    { field: 'coefficient', title: '系数', width: 90, align: 'center' },
  ] as VxeTableGridOptions['columns'];
}

const [EmployeeGrid, employeeGridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useEmployeeFormSchema(),
    submitOnChange: false,
  },
  gridOptions: {
    columns: useEmployeeColumns(isEditable.value),
    height: 480,
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, unknown>,
        ) => {
          const resultLevelFilterValue = formValues?.resultLevelFilter as
            | string
            | undefined;
          const data = await getPerformanceAssessmentPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            planId,
            search: formValues?.search as string,
            deptId: formValues?.deptId as number,
            employeeType: formValues?.employeeType as number,
            employeeStatus: formValues?.employeeStatus as number,
            stageType: formValues?.stageType as number,
            resultLevel:
              resultLevelFilterValue &&
              resultLevelFilterValue !== RESULT_LEVEL_EMPTY_VALUE
                ? resultLevelFilterValue
                : undefined,
            resultLevelEmpty:
              resultLevelFilterValue === RESULT_LEVEL_EMPTY_VALUE
                ? true
                : undefined,
          });
          employeeTotal.value = data.total;
          checkedEmployeeIds.value = [];
          return data;
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    checkboxConfig: { highlight: true },
  },
  gridEvents: {
    checkboxChange: ({
      records,
    }: {
      records: HrmPerformanceAssessmentApi.PerformanceAssessment[];
    }) => {
      checkedEmployeeIds.value = records
        .map(
          (row: HrmPerformanceAssessmentApi.PerformanceAssessment) =>
            row.employeeId,
        )
        .filter((employeeId): employeeId is number => !!employeeId);
    },
    checkboxAll: ({
      records,
    }: {
      records: HrmPerformanceAssessmentApi.PerformanceAssessment[];
    }) => {
      checkedEmployeeIds.value = records
        .map(
          (row: HrmPerformanceAssessmentApi.PerformanceAssessment) =>
            row.employeeId,
        )
        .filter((employeeId): employeeId is number => !!employeeId);
    },
  },
});

watch(isEditable, (editable) => {
  employeeGridApi.setGridOptions({ columns: useEmployeeColumns(editable) });
  checkedEmployeeIds.value = [];
});

onMounted(async () => {
  if (!Number.isSafeInteger(planId) || planId <= 0) {
    message.warning('参数错误，KPI 考核不能为空！');
    close();
    return;
  }
  await getData();
});
</script>

<template>
  <Page auto-content-height>
    <AssessmentAddForm ref="assessmentAddFormRef" @success="getData" />
    <Header :loading="loading" :plan="plan" @back="close">
      <div class="flex flex-wrap items-center gap-2">
        <TableAction
          v-if="isEditable"
          :actions="[
            {
              label: '编辑',
              type: 'primary',
              icon: ACTION_ICON.EDIT,
              auth: ['hrm:performance:plan:update'],
              onClick: openForm,
            },
            {
              label: '启动',
              type: 'default',
              auth: ['hrm:performance:plan:update'],
              onClick: () => handleAction('start'),
            },
          ]"
        />
        <Button v-else type="primary" @click="openSettings">
          查看考核设置
        </Button>
        <TableAction
          v-if="
            plan.status === HrmPerformancePlanStatus.RUNNING &&
            plan.scoringReady
          "
          :actions="[
            {
              label: '开启评分',
              type: 'primary',
              auth: ['hrm:performance:plan:update'],
              onClick: () => handleAction('open'),
            },
          ]"
        />
        <Dropdown v-if="showMoreActions">
          <Button>
            更多
            <IconifyIcon class="ml-1" icon="lucide:chevron-down" />
          </Button>
          <template #popupRender>
            <Menu>
              <Menu.Item
                v-if="
                  plan.status === HrmPerformancePlanStatus.RUNNING &&
                  plan.interviewReady
                "
                @click="handleAction('interview')"
              >
                发起面谈
              </Menu.Item>
              <Menu.Item
                v-if="
                  plan.status === HrmPerformancePlanStatus.RUNNING &&
                  plan.archiveReady
                "
                @click="handleAction('archive')"
              >
                归档
              </Menu.Item>
              <Menu.Item
                v-if="plan.status === HrmPerformancePlanStatus.RUNNING"
                @click="handleAction('terminate')"
              >
                终止
              </Menu.Item>
              <Menu.Item v-if="isEditable" @click="handleDelete">
                删除
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </div>
    </Header>

    <Card class="mt-4">
      <Tabs v-model:active-key="activeTab">
        <TabPane key="details" tab="详细资料">
          <Info :plan="plan" />
        </TabPane>
        <TabPane :tab="`参评员工（${employeeTotal}）`" key="employees">
          <div v-if="stageCountList.length" class="mb-3 flex flex-wrap gap-2">
            <Tag
              v-for="item in stageCountList"
              :key="item.stageType"
              color="processing"
            >
              {{
                getDictLabel(
                  DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS,
                  item.stageType,
                ) || '未知阶段'
              }}（{{ item.count }}）
            </Tag>
          </div>
          <EmployeeGrid>
            <template #toolbar-tools>
              <TableAction
                v-if="isEditable"
                :actions="[
                  {
                    label: '添加员工',
                    type: 'primary',
                    icon: ACTION_ICON.ADD,
                    auth: ['hrm:performance:plan:update'],
                    onClick: () => assessmentAddFormRef?.open(planId),
                  },
                  {
                    label: '移除员工',
                    type: 'default',
                    danger: true,
                    auth: ['hrm:performance:plan:update'],
                    disabled: !checkedEmployeeIds.length,
                    onClick: handleRemoveEmployees,
                  },
                ]"
              />
            </template>
            <template #employeeName="{ row }">
              <a
                class="text-primary cursor-pointer"
                @click="openAssessmentDetail(row.id)"
              >
                {{ row.employeeName || '-' }}
              </a>
            </template>
          </EmployeeGrid>
        </TabPane>
        <TabPane key="operateLog" tab="操作日志">
          <OperateLog :log-list="logList" />
        </TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
