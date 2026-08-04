<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, message } from 'antdv-next';

import {
  addPerformancePlanEmployees,
  getPerformancePlanUnassignedEmployeeIdList,
} from '#/api/hrm/performance/assessment';
import HrmEmployeeMultiSelect from '#/views/hrm/employee/components/employee-multi-select.vue';

defineOptions({ name: 'HrmPerformancePlanAssessmentAddForm' });

const emit = defineEmits(['success']);

const planId = ref<number>();
const selectableEmployeeIds = ref<Set<number>>(new Set());
const employeeIds = ref<number[]>([]);

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (employeeIds.value.length === 0) {
      message.warning('请选择参评员工');
      throw new Error('validation');
    }
    if (!planId.value) return;
    modalApi.lock();
    try {
      await addPerformancePlanEmployees({
        planId: planId.value,
        employeeIds: employeeIds.value,
      });
      message.success('参评员工添加成功');
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      employeeIds.value = [];
      planId.value = undefined;
      selectableEmployeeIds.value = new Set();
    }
  },
});

async function open(id: number) {
  planId.value = id;
  employeeIds.value = [];
  modalApi.open();
  modalApi.setState({ loading: true });
  try {
    selectableEmployeeIds.value = new Set(
      await getPerformancePlanUnassignedEmployeeIdList(id),
    );
  } finally {
    modalApi.setState({ loading: false });
  }
}

function isEmployeeSelectable(id?: number) {
  return !!id && selectableEmployeeIds.value.has(id);
}

defineExpose({ open });
</script>

<template>
  <Modal title="添加参评员工" class="w-[620px]">
    <Form layout="vertical">
      <FormItem label="参评员工" required>
        <HrmEmployeeMultiSelect
          v-model="employeeIds"
          :enabled-ids="[...selectableEmployeeIds]"
          placeholder="请选择未加入当前计划的员工"
          title="选择参评员工"
        />
        <div
          v-if="employeeIds.some((id) => !isEmployeeSelectable(id))"
          class="mt-1 text-red-500"
        >
          请选择未加入当前计划的员工
        </div>
      </FormItem>
    </Form>
  </Modal>
</template>
