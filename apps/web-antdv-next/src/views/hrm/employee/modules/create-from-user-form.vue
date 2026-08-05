<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';
import type { SystemUserApi } from '#/api/system/user';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button, Input, InputNumber, message, Select, Table } from 'antdv-next';

import { createEmployeeList, getBoundUserIdList } from '#/api/hrm/employee';
import {
  HRM_EMPLOYEE_NON_FORMAL_STATUSES,
  HrmEmployeeStatus,
  HrmEmployeeType,
} from '#/views/hrm/utils/constants';
import { DeptTreeSelect } from '#/views/system/dept/components';
import { UserSelect } from '#/views/system/user/components';

import EmployeeSelect from '../components/employee-select.vue';

defineOptions({ name: 'HrmEmployeeCreateFromUserForm' });

const emit = defineEmits(['success']);

type EmployeeRow = HrmEmployeeApi.CreateFromUserReq & {
  index: number;
  nickname?: string;
  username?: string;
};

const loading = ref(false);
const selectedUserIds = ref<number[]>([]);
const boundUserIds = ref<number[]>([]);
const employees = ref<EmployeeRow[]>([]);
const employeeTypeOptions = getDictOptions(
  DICT_TYPE.HRM_EMPLOYEE_TYPE,
  'number',
).map(({ label, value }) => ({ label, value: Number(value) }));
const nonFormalStatusSet = new Set<number>(HRM_EMPLOYEE_NON_FORMAL_STATUSES);
const nonFormalStatusOptions = getDictOptions(
  DICT_TYPE.HRM_EMPLOYEE_STATUS,
  'number',
)
  .filter(({ value }) => nonFormalStatusSet.has(Number(value)))
  .map(({ label, value }) => ({ label, value: Number(value) }));

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (employees.value.length === 0) {
      message.warning('请先选择未建档的后台用户');
      return;
    }
    for (const row of employees.value) {
      if (!row.mobile?.trim()) {
        message.warning('请填写手机号');
        return;
      }
      if (!row.jobNumber?.trim()) {
        message.warning('请填写工号');
        return;
      }
      if (!row.entryTime) {
        message.warning('请选择入职时间');
        return;
      }
    }
    modalApi.lock();
    try {
      const result = await createEmployeeList(employees.value);
      message.success(`已创建 ${result.length} 份员工档案`);
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
});

async function open() {
  selectedUserIds.value = [];
  employees.value = [];
  modalApi.setState({ title: '从后台用户批量建档' });
  modalApi.open();
  loading.value = true;
  try {
    boundUserIds.value = await getBoundUserIdList();
  } finally {
    loading.value = false;
  }
}

function handleUserChange(
  users: SystemUserApi.User | SystemUserApi.User[] | undefined,
) {
  const list = Array.isArray(users) ? users : users ? [users] : [];
  const oldMap = new Map(
    employees.value.map((row: EmployeeRow) => [row.userId, row]),
  );
  employees.value = list.map((user, index) => {
    const old = oldMap.get(user.id!);
    if (old) {
      return { ...old, index };
    }
    return {
      index,
      userId: user.id!,
      username: user.username,
      nickname: user.nickname,
      mobile: user.mobile || '',
      jobNumber: '',
      deptId: user.deptId,
      type: HrmEmployeeType.FORMAL,
      probation: 0,
      entryTime: Date.now(),
      postName: '',
    };
  });
}

function handleTypeChange(row: EmployeeRow) {
  if (row.type === HrmEmployeeType.FORMAL) {
    row.status = undefined;
    row.probation = row.probation ?? 0;
  } else {
    row.probation = undefined;
    row.status = row.status ?? HrmEmployeeStatus.INTERN;
  }
}

function removeRow(index: number) {
  const removed = employees.value[index]?.userId;
  selectedUserIds.value = selectedUserIds.value.filter((id) => id !== removed);
  employees.value.splice(index, 1);
  employees.value.forEach((row, i) => (row.index = i));
}

defineExpose({ open });
</script>

<template>
  <Modal class="w-[96%]" :loading="loading">
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <span class="whitespace-nowrap">选择未建档用户</span>
      <UserSelect
        v-model="selectedUserIds"
        multiple
        class="!w-[520px]"
        placeholder="请选择后台用户"
        @change="handleUserChange"
      />
      <span class="text-muted-foreground text-xs">
        已选择 {{ employees.length }} 人
      </span>
    </div>
    <Table
      :columns="[
        { title: '后台用户', key: 'user', width: 170, fixed: 'left' },
        { title: '手机号', key: 'mobile', width: 170 },
        { title: '部门', key: 'deptId', width: 180 },
        { title: '工号', key: 'jobNumber', width: 150 },
        { title: '直属上级', key: 'leaderEmployeeId', width: 190 },
        { title: '职位', key: 'postName', width: 170 },
        { title: '入职时间', key: 'entryTime', width: 190 },
        { title: '聘用形式', key: 'type', width: 130 },
        { title: '试用期/状态', key: 'statusProbation', width: 150 },
        { title: '操作', key: 'action', width: 70, fixed: 'right' },
      ]"
      :data-source="employees"
      :pagination="false"
      :row-key="(row) => row.userId"
      bordered
      :scroll="{ x: 1400, y: 420 }"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'user'">
          <div>{{ record.nickname || '-' }}</div>
          <div class="text-muted-foreground text-xs">{{ record.username }}</div>
        </template>
        <template v-else-if="column.key === 'mobile'">
          <Input v-model:value="record.mobile" placeholder="请输入手机号" />
        </template>
        <template v-else-if="column.key === 'deptId'">
          <DeptTreeSelect v-model="record.deptId" class="w-full" />
        </template>
        <template v-else-if="column.key === 'jobNumber'">
          <Input v-model:value="record.jobNumber" placeholder="请输入工号" />
        </template>
        <template v-else-if="column.key === 'leaderEmployeeId'">
          <EmployeeSelect v-model="record.leaderEmployeeId" />
        </template>
        <template v-else-if="column.key === 'postName'">
          <Input v-model:value="record.postName" placeholder="请输入职位" />
        </template>
        <template v-else-if="column.key === 'entryTime'">
          <InputNumber v-model:value="record.entryTime" class="!w-full" />
        </template>
        <template v-else-if="column.key === 'type'">
          <Select
            v-model:value="record.type"
            :options="employeeTypeOptions"
            class="w-full"
            @change="() => handleTypeChange(record)"
          />
        </template>
        <template v-else-if="column.key === 'statusProbation'">
          <InputNumber
            v-if="record.type === HrmEmployeeType.FORMAL"
            v-model:value="record.probation"
            :max="6"
            :min="0"
            class="!w-full"
          />
          <Select
            v-else
            v-model:value="record.status"
            :options="nonFormalStatusOptions"
            class="w-full"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <Button danger type="link" @click="removeRow(record.index)">
            移除
          </Button>
        </template>
      </template>
    </Table>
  </Modal>
</template>
