<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';
import type { SystemUserApi } from '#/api/system/user';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  ElButton,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

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

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (employees.value.length === 0) {
      ElMessage.warning('请先选择未建档的后台用户');
      return;
    }
    for (const row of employees.value) {
      if (!row.mobile?.trim()) {
        ElMessage.warning('请填写手机号');
        return;
      }
      if (!row.jobNumber?.trim()) {
        ElMessage.warning('请填写工号');
        return;
      }
      if (!row.entryTime) {
        ElMessage.warning('请选择入职时间');
        return;
      }
    }
    modalApi.lock();
    try {
      const result = await createEmployeeList(employees.value);
      ElMessage.success(`已创建 ${result.length} 份员工档案`);
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
    <ElTable
      :data="employees"
      border
      max-height="420"
      row-key="userId"
      size="small"
    >
      <ElTableColumn fixed="left" label="后台用户" width="170">
        <template #default="{ row }">
          <div>{{ row.nickname || '-' }}</div>
          <div class="text-muted-foreground text-xs">{{ row.username }}</div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="手机号" width="170">
        <template #default="{ row }">
          <ElInput v-model="row.mobile" placeholder="请输入手机号" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="部门" width="180">
        <template #default="{ row }">
          <DeptTreeSelect v-model="row.deptId" class="w-full" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="工号" width="150">
        <template #default="{ row }">
          <ElInput v-model="row.jobNumber" placeholder="请输入工号" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="直属上级" width="190">
        <template #default="{ row }">
          <EmployeeSelect v-model="row.leaderEmployeeId" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="职位" width="170">
        <template #default="{ row }">
          <ElInput v-model="row.postName" placeholder="请输入职位" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="入职时间" width="190">
        <template #default="{ row }">
          <ElInputNumber
            v-model="row.entryTime"
            class="!w-full"
            controls-position="right"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn label="聘用形式" width="130">
        <template #default="{ row }">
          <ElSelect
            v-model="row.type"
            class="w-full"
            @change="() => handleTypeChange(row as EmployeeRow)"
          >
            <ElOption
              v-for="item in getDictOptions(
                DICT_TYPE.HRM_EMPLOYEE_TYPE,
                'number',
              )"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </template>
      </ElTableColumn>
      <ElTableColumn label="试用期/状态" width="150">
        <template #default="{ row }">
          <ElInputNumber
            v-if="row.type === HrmEmployeeType.FORMAL"
            v-model="row.probation"
            :max="6"
            :min="0"
            class="!w-full"
            controls-position="right"
          />
          <ElSelect v-else v-model="row.status" class="w-full">
            <ElOption
              v-for="item in getDictOptions(
                DICT_TYPE.HRM_EMPLOYEE_STATUS,
                'number',
              ).filter((option) =>
                HRM_EMPLOYEE_NON_FORMAL_STATUSES.includes(
                  Number(option.value) as 3 | 4 | 5 | 6 | 7 | 8,
                ),
              )"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </template>
      </ElTableColumn>
      <ElTableColumn fixed="right" label="操作" width="70">
        <template #default="{ row }">
          <ElButton link type="danger" @click="removeRow(row.index)">
            移除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </Modal>
</template>
