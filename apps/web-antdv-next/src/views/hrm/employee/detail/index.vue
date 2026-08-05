<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import {
  Button,
  Card,
  Dropdown,
  Menu,
  message,
  Modal,
  TabPane,
  Tabs,
} from 'antdv-next';

import { cancelEmployeeQuit, getEmployee } from '#/api/hrm/employee';
import { getOperateLogPage } from '#/api/hrm/operate-log';
import { OperateLog } from '#/components/operate-log';
import { ACTION_ICON, TableAction } from '#/components/table-action';
import {
  HrmBizType,
  HrmEmployeeChangeType,
  HrmEmployeeEntryStatus,
  HrmEmployeeStatus,
} from '#/views/hrm/utils/constants';

import Form from '../modules/form.vue';
import FullTimeForm from '../modules/full-time-form.vue';
import PositionChangeForm from '../modules/position-change-form.vue';
import QuitForm from '../modules/quit-form.vue';
import RegularForm from '../modules/regular-form.vue';
import BasicInfo from './modules/basic-info.vue';
import ContractList from './modules/contract-list.vue';
import Header from './modules/header.vue';
import MaterialFiles from './modules/material-files.vue';
import PostInfo from './modules/post-info.vue';
import SalarySocialSecurity from './modules/salary-social-security.vue';

defineOptions({ name: 'HrmEmployeeDetail' });

const route = useRoute();
const router = useRouter();
const tabs = useTabs();
const { hasAccessByCodes } = useAccess();

const employeeId = Number(route.params.id);
const loading = ref(true);
const activeTab = ref('post');
const employee = ref<HrmEmployeeApi.Employee>({} as HrmEmployeeApi.Employee);
const logList = ref<SystemOperateLogApi.OperateLog[]>([]);
const cancelQuitReason = ref('');

const changeableEntryStatuses = [
  HrmEmployeeEntryStatus.ACTIVE,
  HrmEmployeeEntryStatus.PENDING_LEAVE,
];

const changeActionOptions = computed(() => {
  const actions: Array<{
    changeType: number;
    icon: string;
    label: string;
  }> = [
    {
      label: '调整部门/岗位',
      changeType: HrmEmployeeChangeType.TRANSFER,
      icon: ACTION_ICON.EDIT,
    },
    {
      label: '晋升',
      changeType: HrmEmployeeChangeType.PROMOTION,
      icon: ACTION_ICON.EDIT,
    },
    {
      label: '降级',
      changeType: HrmEmployeeChangeType.DEMOTION,
      icon: ACTION_ICON.EDIT,
    },
  ];
  if (employee.value.status === HrmEmployeeStatus.PROBATION) {
    actions.unshift({
      label: '办理转正',
      changeType: HrmEmployeeChangeType.REGULAR,
      icon: ACTION_ICON.EDIT,
    });
  }
  if (
    employee.value.status === HrmEmployeeStatus.INTERN ||
    employee.value.status === HrmEmployeeStatus.PART_TIME
  ) {
    actions.push({
      label: '转为全职',
      changeType: HrmEmployeeChangeType.FULL_TIME,
      icon: ACTION_ICON.EDIT,
    });
  }
  return actions;
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
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

function close() {
  tabs.closeCurrentTab();
  router.push({ name: 'HrmEmployee' });
}

async function getOperateLog() {
  const data = await getOperateLogPage({
    bizType: HrmBizType.EMPLOYEE,
    bizId: employeeId,
  });
  logList.value = data.list;
}

async function getEmployeeData() {
  loading.value = true;
  try {
    const data = await getEmployee(employeeId);
    if (!data) {
      message.warning('员工不存在');
      close();
      return;
    }
    employee.value = data;
    await getOperateLog();
  } finally {
    loading.value = false;
  }
}

function openEmployeeForm() {
  formModalApi.setData({ type: 'update', id: employeeId }).open();
}

function openRehire() {
  formModalApi.setData({ type: 'rehire', id: employeeId }).open();
}

function handleConfirmEntry() {
  formModalApi.setData({ type: 'confirm', id: employeeId }).open();
}

function openChangeAction(changeType: number) {
  if (changeType === HrmEmployeeChangeType.REGULAR) {
    regularModalApi.setData(employee.value).open();
    return;
  }
  if (changeType === HrmEmployeeChangeType.TRANSFER) {
    positionChangeModalApi
      .setData({ employee: employee.value, mode: 'transfer' })
      .open();
    return;
  }
  if (changeType === HrmEmployeeChangeType.PROMOTION) {
    positionChangeModalApi
      .setData({ employee: employee.value, mode: 'promote' })
      .open();
    return;
  }
  if (changeType === HrmEmployeeChangeType.DEMOTION) {
    positionChangeModalApi
      .setData({ employee: employee.value, mode: 'demote' })
      .open();
    return;
  }
  if (changeType === HrmEmployeeChangeType.FULL_TIME) {
    fullTimeModalApi.setData(employee.value).open();
  }
}

function openQuit() {
  quitModalApi.setData(employee.value).open();
}

async function handleCancelQuit() {
  cancelQuitReason.value = '';
  Modal.confirm({
    title: '取消离职',
    content: '请输入取消离职原因',
    onOk: async () => {
      const reason = cancelQuitReason.value.trim();
      if (!reason) {
        message.warning('取消原因不能为空');
        throw new Error('empty');
      }
      await cancelEmployeeQuit({ employeeId, reason });
      message.success('已取消离职');
      await getEmployeeData();
    },
  });
}

function getMoreActions() {
  const actions: Array<{ command: string; icon: string; label: string }> = [];
  if (
    employee.value.entryStatus === HrmEmployeeEntryStatus.ACTIVE &&
    hasAccessByCodes(['hrm:employee:update'])
  ) {
    actions.push({
      command: 'quit',
      label: '办理离职',
      icon: ACTION_ICON.DELETE,
    });
  }
  if (
    employee.value.entryStatus === HrmEmployeeEntryStatus.PENDING_LEAVE &&
    hasAccessByCodes(['hrm:employee:update'])
  ) {
    actions.push({
      command: 'cancel-quit',
      label: '取消离职',
      icon: ACTION_ICON.EDIT,
    });
  }
  return actions;
}

function handleMoreCommand(command: string) {
  if (command === 'quit') openQuit();
  if (command === 'cancel-quit') handleCancelQuit();
}

onMounted(() => {
  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
    message.warning('参数错误，员工不能为空！');
    close();
    return;
  }
  getEmployeeData();
});
</script>

<template>
  <Page auto-content-height :loading="loading">
    <FormModal @success="getEmployeeData" />
    <RegularModal @success="getEmployeeData" />
    <PositionChangeModal @success="getEmployeeData" />
    <FullTimeModal @success="getEmployeeData" />
    <QuitModal @success="getEmployeeData" />

    <Header :employee="employee" :loading="loading">
      <div class="flex flex-wrap gap-2">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'primary',
              icon: ACTION_ICON.EDIT,
              auth: ['hrm:employee:update'],
              disabled: !employee.id,
              onClick: openEmployeeForm,
            },
          ]"
        />
        <Button
          v-if="
            employee.entryStatus === HrmEmployeeEntryStatus.PENDING_ENTRY &&
            hasAccessByCodes(['hrm:employee:update'])
          "
          type="primary"
          @click="handleConfirmEntry"
        >
          确认入职
        </Button>
        <Button
          v-if="
            employee.entryStatus === HrmEmployeeEntryStatus.LEFT &&
            hasAccessByCodes(['hrm:employee:update'])
          "
          @click="openRehire"
        >
          办理再入职
        </Button>
        <Dropdown
          v-if="
            (changeableEntryStatuses as readonly number[]).includes(
              employee.entryStatus || 0,
            ) && hasAccessByCodes(['hrm:employee:update'])
          "
        >
          <Button type="primary">办理异动</Button>
          <template #popupRender>
            <Menu>
              <Menu.Item
                v-for="action in changeActionOptions"
                :key="action.changeType"
                @click="openChangeAction(action.changeType)"
              >
                {{ action.label }}
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
        <Dropdown v-if="getMoreActions().length">
          <Button>更多</Button>
          <template #popupRender>
            <Menu>
              <Menu.Item
                v-for="action in getMoreActions()"
                :key="action.command"
                @click="handleMoreCommand(action.command)"
              >
                {{ action.label }}
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </div>
    </Header>

    <Tabs v-model:active-key="activeTab">
      <TabPane key="post" tab="岗位信息">
        <PostInfo
          :employee="employee"
          :employee-id="employeeId"
          @edit-quit="openQuit"
          @refresh="getEmployeeData"
        />
      </TabPane>
      <TabPane key="basic" tab="基本信息" :force-render="false">
        <BasicInfo :employee="employee" :employee-id="employeeId" />
      </TabPane>
      <TabPane key="contract" tab="员工合同" :force-render="false">
        <Card title="合同信息" :style="{ marginBottom: '15px' }">
          <ContractList :employee-id="employeeId" />
        </Card>
      </TabPane>
      <TabPane key="salary" tab="工资社保" :force-render="false">
        <SalarySocialSecurity :employee-id="employeeId" />
      </TabPane>
      <TabPane key="file" tab="材料附件" :force-render="false">
        <MaterialFiles :employee-id="employeeId" @success="getOperateLog" />
      </TabPane>
      <TabPane key="operateLog" tab="操作记录">
        <OperateLog :log-list="logList" />
      </TabPane>
    </Tabs>
  </Page>
</template>
