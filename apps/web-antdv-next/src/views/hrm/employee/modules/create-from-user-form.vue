<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { DatePicker, Input, InputNumber, message, Select } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { createEmployeeList, getBoundUserIdList } from '#/api/hrm/employee';
import {
  HRM_EMPLOYEE_NON_FORMAL_STATUSES,
  HrmEmployeeStatus,
  HrmEmployeeType,
} from '#/views/hrm/utils/constants';
import { DeptTreeSelect } from '#/views/system/dept/components';
import { UserSelect } from '#/views/system/user/components';

import EmployeeSelect from '../components/employee-select.vue';
import { useCreateFromUserGridColumns } from '../data';

defineOptions({ name: 'HrmEmployeeCreateFromUserForm' });

const emit = defineEmits(['success']);

const loading = ref(false);
const selectedUserIds = ref<number[]>([]);
const boundUserIds = ref<number[]>([]);
const employees = ref<any[]>([]);
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

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useCreateFromUserGridColumns(),
    data: [],
    height: 460,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'userId', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<any>,
});

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
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    selectedUserIds.value = [];
    employees.value = [];
    await nextTick();
    await gridApi.grid.reloadData([]);
    modalApi.setState({ title: '从后台用户批量建档' });
    loading.value = true;
    try {
      boundUserIds.value = await getBoundUserIdList();
    } finally {
      loading.value = false;
    }
  },
});

async function handleUserChange(
  users: SystemUserApi.User | SystemUserApi.User[] | undefined,
) {
  const list = Array.isArray(users) ? users : [];
  if (users && !Array.isArray(users)) {
    list.push(users);
  }
  const oldMap = new Map(employees.value.map((row) => [row.userId, row]));
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
  await nextTick();
  await gridApi.grid.reloadData(employees.value);
}

function handleTypeChange(row: any) {
  if (row.type === HrmEmployeeType.FORMAL) {
    row.status = undefined;
    row.probation = row.probation ?? 0;
  } else {
    row.probation = undefined;
    row.status = row.status ?? HrmEmployeeStatus.INTERN;
  }
}

async function removeRow(index: number) {
  const removed = employees.value[index]?.userId;
  selectedUserIds.value = selectedUserIds.value.filter((id) => id !== removed);
  employees.value.splice(index, 1);
  employees.value.forEach((row, i) => (row.index = i));
  await gridApi.grid.reloadData(employees.value);
}
</script>

<template>
  <Modal class="w-[96%]" :loading="loading">
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <span class="whitespace-nowrap">选择未建档用户</span>
      <UserSelect
        v-model="selectedUserIds"
        :exclude-ids="boundUserIds"
        multiple
        class="!w-[520px]"
        placeholder="请选择后台用户"
        @change="handleUserChange"
      />
      <span class="text-muted-foreground text-xs">
        已选择 {{ employees.length }} 人
      </span>
    </div>
    <Grid class="w-full">
      <template #user="{ row }">
        <div>{{ row.nickname || '-' }}</div>
        <div class="text-muted-foreground text-xs">
          {{ row.username }}
        </div>
      </template>
      <template #mobile="{ row }">
        <Input v-model:value="row.mobile" placeholder="请输入手机号" />
      </template>
      <template #deptId="{ row }">
        <DeptTreeSelect v-model="row.deptId" class="w-full" />
      </template>
      <template #jobNumber="{ row }">
        <Input v-model:value="row.jobNumber" placeholder="请输入工号" />
      </template>
      <template #leaderEmployeeId="{ row }">
        <EmployeeSelect v-model="row.leaderEmployeeId" />
      </template>
      <template #postName="{ row }">
        <Input v-model:value="row.postName" placeholder="请输入职位" />
      </template>
      <template #entryTime="{ row }">
        <DatePicker
          :value="String(row.entryTime)"
          class="w-full"
          show-time
          value-format="x"
          @update:value="(value) => (row.entryTime = Number(value))"
        />
      </template>
      <template #type="{ row }">
        <Select
          v-model:value="row.type"
          :options="employeeTypeOptions"
          class="w-full"
          @change="() => handleTypeChange(row)"
        />
      </template>
      <template #statusProbation="{ row }">
        <InputNumber
          v-if="row.type === HrmEmployeeType.FORMAL"
          v-model:value="row.probation"
          :max="6"
          :min="0"
          class="!w-full"
        />
        <Select
          v-else
          v-model:value="row.status"
          :options="nonFormalStatusOptions"
          class="w-full"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '移除',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              onClick: () => removeRow(row.index),
            },
          ]"
        />
      </template>
    </Grid>
  </Modal>
</template>
