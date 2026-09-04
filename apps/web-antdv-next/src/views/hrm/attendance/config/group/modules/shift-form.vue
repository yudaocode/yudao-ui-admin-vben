<script lang="ts" setup>
import type { HrmAttendanceGroupApi } from '#/api/hrm/attendance/group';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Alert } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { formatHrmAttendanceShiftDuration } from '#/views/hrm/utils/format';

import { useShiftFormSchema } from '../data';

defineOptions({ name: 'HrmAttendanceGroupShiftForm' });

const emit = defineEmits<{
  confirm: [shift: HrmAttendanceGroupApi.Shift, index?: number];
}>();
const editIndex = ref<number>();
const currentValues = ref<any>({});

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' }, labelWidth: 120 },
  handleValuesChange(values) {
    currentValues.value = values;
  },
  layout: 'horizontal',
  schema: useShiftFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

const durationText = computed(() => {
  const values = currentValues.value;
  return formatHrmAttendanceShiftDuration({
    ...values,
    restStartTime: values.restTimeRange?.[0],
    restEndTime: values.restTimeRange?.[1],
  });
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    emit(
      'confirm',
      {
        weeks: [...values.weeks].toSorted((a, b) => a - b),
        startTime: values.startTime,
        endTime: values.endTime,
        clockInStartTime: values.clockInTimeRange[0],
        clockInEndTime: values.clockInTimeRange[1],
        clockOutStartTime: values.clockOutTimeRange[0],
        clockOutEndTime: values.clockOutTimeRange[1],
        restStartTime: values.restTimeRange[0],
        restEndTime: values.restTimeRange[1],
        excludeRestTime: values.excludeRestTime,
      },
      editIndex.value,
    );
    await modalApi.close();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { index, shift } = modalApi.getData() as any;
    editIndex.value = index;
    modalApi.setState({
      title: index === undefined ? '新增班次' : '编辑班次',
    });
    await formApi.reset();
    if (shift) {
      await formApi.setValues({
        ...shift,
        weeks: [...shift.weeks],
        clockInTimeRange: [shift.clockInStartTime, shift.clockInEndTime],
        clockOutTimeRange: [shift.clockOutStartTime, shift.clockOutEndTime],
        restTimeRange: [shift.restStartTime, shift.restEndTime],
      });
    }
    currentValues.value = await formApi.getValues();
  },
});
</script>

<template>
  <Modal class="w-[760px]">
    <Alert
      class="mx-4 mb-4"
      message="打卡窗口需覆盖对应的上下班时间；结束时间早于开始时间时按次日计算，例如 18:00 至次日 04:59。"
      show-icon
      type="info"
    />
    <Form class="mx-4" />
    <div class="mb-4 ml-[136px] text-sm">合计工作时长：{{ durationText }}</div>
  </Modal>
</template>
