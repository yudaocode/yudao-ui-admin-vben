<script lang="ts" setup>
import type { FormInstance, Rule } from 'antdv-next';

import type { HrmPortalAttendanceLeaveApi } from '#/api/hrm/portal/attendance/leave';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { fromTimestampPickerValue, toTimestampPickerValue } from '@vben/utils';

import {
  DatePicker,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Select,
} from 'antdv-next';

import { createMyAttendanceLeave } from '#/api/hrm/portal/attendance/leave';

defineOptions({ name: 'HrmPortalAttendanceLeaveForm' });

const emit = defineEmits<{
  success: [];
}>();

const formRef = ref<FormInstance>();
const formData = ref<HrmPortalAttendanceLeaveApi.LeaveCreate>({
  type: undefined,
  startTime: undefined,
  endTime: undefined,
  day: 1,
  reason: '',
  remark: '',
});
const leaveTypeOptions = getDictOptions(
  DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE,
  'string',
);

const formRules: Record<string, Rule[]> = {
  type: [{ required: true, message: '请选择请假类型', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    {
      validator: async (_rule: Rule, value: unknown) => {
        if (
          value &&
          formData.value.startTime &&
          Number(value) <= Number(formData.value.startTime)
        ) {
          throw new Error('结束时间必须晚于开始时间');
        }
      },
      trigger: 'change',
    },
  ],
  day: [{ required: true, message: '请输入请假天数', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入请假事由', trigger: 'blur' }],
};

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await submitForm();
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      resetForm();
    }
  },
  title: '请假申请',
});

/** 打开弹窗 */
function open() {
  resetForm();
  modalApi.open();
}

defineExpose({ open });

/** 提交表单 */
async function submitForm() {
  if (!formRef.value) {
    return;
  }
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  modalApi.lock();
  try {
    await createMyAttendanceLeave({
      ...formData.value,
      startTime: Number(formData.value.startTime),
      endTime: Number(formData.value.endTime),
    });
    message.success('请假申请已提交');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 重置表单 */
async function resetForm() {
  formData.value = {
    type: undefined,
    startTime: undefined,
    endTime: undefined,
    day: 1,
    reason: '',
    remark: '',
  };
  await nextTick();
  formRef.value?.resetFields();
}
</script>

<template>
  <Modal class="w-[600px]">
    <Form
      ref="formRef"
      :label-col="{ style: { width: '100px' } }"
      :model="formData"
      :rules="formRules"
    >
      <FormItem label="请假类型" name="type">
        <Select
          v-model:value="formData.type"
          allow-clear
          class="w-full"
          :options="leaveTypeOptions"
          placeholder="请选择请假类型"
        />
      </FormItem>
      <FormItem label="开始时间" name="startTime">
        <DatePicker
          :value="toTimestampPickerValue(formData.startTime)"
          class="w-full"
          format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择开始时间"
          show-time
          value-format="x"
          @update:value="formData.startTime = fromTimestampPickerValue($event)"
        />
      </FormItem>
      <FormItem label="结束时间" name="endTime">
        <DatePicker
          :value="toTimestampPickerValue(formData.endTime)"
          class="w-full"
          format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择结束时间"
          show-time
          value-format="x"
          @update:value="formData.endTime = fromTimestampPickerValue($event)"
        />
      </FormItem>
      <FormItem label="请假天数" name="day">
        <InputNumber
          v-model:value="formData.day"
          class="w-full"
          :min="0.01"
          placeholder="请输入请假天数"
          :precision="2"
          :step="0.5"
        />
      </FormItem>
      <FormItem label="请假事由" name="reason">
        <Input.TextArea
          v-model:value="formData.reason"
          :maxlength="300"
          placeholder="请输入请假事由"
          :rows="3"
          show-count
        />
      </FormItem>
      <FormItem label="备注" name="remark">
        <Input.TextArea
          v-model:value="formData.remark"
          :maxlength="500"
          placeholder="请输入备注"
          :rows="2"
          show-count
        />
      </FormItem>
    </Form>
  </Modal>
</template>
