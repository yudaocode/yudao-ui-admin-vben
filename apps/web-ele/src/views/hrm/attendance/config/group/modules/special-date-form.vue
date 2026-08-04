<script lang="ts" setup>
import type { HrmAttendanceGroupApi } from '#/api/hrm/attendance/group';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElOption,
  ElSelect,
} from 'element-plus';

import { HrmAttendanceHolidayType } from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmAttendanceGroupSpecialDateForm' });

const emit = defineEmits<{
  confirm: [specialDate: HrmAttendanceGroupApi.SpecialDate, index?: number];
}>();

const editIndex = ref<number>();
const formRef = ref();
const formData = ref<HrmAttendanceGroupApi.SpecialDate>(createDefault());

const formRules = reactive({
  type: [
    { required: true, message: '特殊日期类型不能为空', trigger: 'change' },
  ],
  date: [{ required: true, message: '日期不能为空', trigger: 'change' }],
});

function createDefault(): HrmAttendanceGroupApi.SpecialDate {
  return { type: HrmAttendanceHolidayType.WORK, date: undefined };
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
    emit('confirm', { ...formData.value }, editIndex.value);
    await modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const payload = modalApi.getData<{
      index?: number;
      specialDate?: HrmAttendanceGroupApi.SpecialDate;
    }>();
    editIndex.value = payload?.index;
    formData.value = payload?.specialDate
      ? { ...payload.specialDate }
      : createDefault();
  },
});

defineExpose({
  open(specialDate?: HrmAttendanceGroupApi.SpecialDate, index?: number) {
    modalApi.setData({ specialDate, index }).open();
  },
});
</script>

<template>
  <Modal
    :title="editIndex === undefined ? '新增特殊日期' : '编辑特殊日期'"
    class="w-[560px]"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="120px"
    >
      <ElFormItem label="特殊日期类型" prop="type">
        <ElSelect
          v-model="formData.type"
          class="w-full"
          placeholder="请选择特殊日期类型"
        >
          <ElOption :value="HrmAttendanceHolidayType.WORK" label="上班" />
          <ElOption :value="HrmAttendanceHolidayType.REST" label="休息" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="日期" prop="date">
        <ElDatePicker
          v-model="formData.date"
          class="!w-full"
          placeholder="请选择日期"
          type="date"
          value-format="x"
        />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
