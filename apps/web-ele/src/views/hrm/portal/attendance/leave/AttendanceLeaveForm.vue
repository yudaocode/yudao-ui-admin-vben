<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { HrmPortalAttendanceLeaveApi } from '#/api/hrm/portal/attendance/leave';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

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

const formRules: FormRules = {
  type: [{ required: true, message: '请选择请假类型', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    {
      validator: (_rule, value, callback) => {
        if (
          value &&
          formData.value.startTime &&
          Number(value) <= Number(formData.value.startTime)
        ) {
          callback(new Error('结束时间必须晚于开始时间'));
          return;
        }
        callback();
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
    ElMessage.success('请假申请已提交');
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
    <ElForm
      ref="formRef"
      label-width="100px"
      :model="formData"
      :rules="formRules"
    >
      <ElFormItem label="请假类型" prop="type">
        <ElSelect
          v-model="formData.type"
          clearable
          class="!w-full"
          placeholder="请选择请假类型"
        >
          <ElOption
            v-for="item in leaveTypeOptions"
            :key="String(item.value)"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="开始时间" prop="startTime">
        <ElDatePicker
          v-model="formData.startTime"
          class="!w-full"
          format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择开始时间"
          type="datetime"
          value-format="x"
        />
      </ElFormItem>
      <ElFormItem label="结束时间" prop="endTime">
        <ElDatePicker
          v-model="formData.endTime"
          class="!w-full"
          format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择结束时间"
          type="datetime"
          value-format="x"
        />
      </ElFormItem>
      <ElFormItem label="请假天数" prop="day">
        <ElInputNumber
          v-model="formData.day"
          class="!w-full"
          controls-position="right"
          :min="0.01"
          placeholder="请输入请假天数"
          :precision="2"
          :step="0.5"
        />
      </ElFormItem>
      <ElFormItem label="请假事由" prop="reason">
        <ElInput
          v-model="formData.reason"
          maxlength="300"
          placeholder="请输入请假事由"
          :rows="3"
          show-word-limit
          type="textarea"
        />
      </ElFormItem>
      <ElFormItem label="备注" prop="remark">
        <ElInput
          v-model="formData.remark"
          maxlength="500"
          placeholder="请输入备注"
          :rows="2"
          show-word-limit
          type="textarea"
        />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
