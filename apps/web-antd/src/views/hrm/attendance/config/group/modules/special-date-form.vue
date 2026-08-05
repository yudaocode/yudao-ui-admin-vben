<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { HrmAttendanceGroupApi } from '#/api/hrm/attendance/group';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { DatePicker, Form, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { HrmAttendanceHolidayType } from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmAttendanceGroupSpecialDateForm' });

const emit = defineEmits<{
  confirm: [specialDate: HrmAttendanceGroupApi.SpecialDate, index?: number];
}>();

const editIndex = ref<number>();
const formRef = ref();
const formData = ref<HrmAttendanceGroupApi.SpecialDate>(createDefault());

const formRules = reactive<Record<string, Rule[]>>({
  type: [
    { required: true, message: '特殊日期类型不能为空', trigger: 'change' },
  ],
  date: [{ required: true, message: '日期不能为空', trigger: 'change' }],
});

function createDefault(): HrmAttendanceGroupApi.SpecialDate {
  return {
    type: HrmAttendanceHolidayType.WORK,
    date: undefined,
  };
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
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="120px"
    >
      <Form.Item label="特殊日期类型" name="type">
        <Select
          v-model:value="formData.type"
          class="w-full"
          placeholder="请选择特殊日期类型"
        >
          <Select.Option :value="HrmAttendanceHolidayType.WORK">
            上班
          </Select.Option>
          <Select.Option :value="HrmAttendanceHolidayType.REST">
            休息
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item label="日期" name="date">
        <DatePicker
          :value="formData.date ? dayjs(formData.date) : undefined"
          class="w-full"
          placeholder="请选择日期"
          value-format="x"
          @update:value="
            (value) => (formData.date = value ? Number(value) : undefined)
          "
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
