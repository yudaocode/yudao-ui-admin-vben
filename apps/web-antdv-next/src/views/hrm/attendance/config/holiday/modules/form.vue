<script lang="ts" setup>
import type { Rule } from 'antdv-next';

import type { HrmAttendanceHolidayApi } from '#/api/hrm/attendance/holiday';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { fromTimestampPickerValue, toTimestampPickerValue } from '@vben/utils';

import { DatePicker, Form, FormItem, message, Select } from 'antdv-next';

import {
  createAttendanceHoliday,
  getAttendanceHoliday,
  updateAttendanceHoliday,
} from '#/api/hrm/attendance/holiday';
import { $t } from '#/locales';
import { HrmAttendanceHolidayType } from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmAttendanceHolidayForm' });

const emit = defineEmits(['success']);

const formType = ref<'create' | 'update'>('create');
const formRef = ref();
const formData = ref<HrmAttendanceHolidayApi.AttendanceHoliday>({
  type: HrmAttendanceHolidayType.REST,
});
const formRules = reactive<Record<string, Rule[]>>({
  date: [{ required: true, message: '日期不能为空', trigger: 'change' }],
  type: [{ required: true, message: '日期类型不能为空', trigger: 'change' }],
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
    modalApi.lock();
    try {
      await (formType.value === 'create'
        ? createAttendanceHoliday(formData.value)
        : updateAttendanceHoliday(formData.value));
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const data = modalApi.getData<{ id?: number; type: 'create' | 'update' }>();
    formType.value = data?.type || 'create';
    formData.value = data?.id
      ? await getAttendanceHoliday(data.id)
      : { type: HrmAttendanceHolidayType.REST };
  },
});
</script>

<template>
  <Modal
    :title="formType === 'create' ? '新增节假日' : '编辑节假日'"
    class="w-[520px]"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="88px"
    >
      <FormItem label="日期" name="date">
        <DatePicker
          :value="toTimestampPickerValue(formData.date)"
          class="w-full"
          value-format="x"
          @update:value="formData.date = fromTimestampPickerValue($event)"
        />
      </FormItem>
      <FormItem label="日期类型" name="type">
        <Select
          v-model:value="formData.type"
          :options="
            getDictOptions(DICT_TYPE.HRM_ATTENDANCE_HOLIDAY_TYPE, 'number')
          "
          class="w-full"
          placeholder="请选择日期类型"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
