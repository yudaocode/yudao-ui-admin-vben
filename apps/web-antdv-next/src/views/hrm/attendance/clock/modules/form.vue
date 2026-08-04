<script lang="ts" setup>
import type { HrmAttendanceClockApi } from '#/api/hrm/attendance/clock';

import { computed, ref, watch } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';
import { formatDate } from '@vben/utils';

import { Alert, message } from 'antdv-next';
import dayjs from 'dayjs';

import {
  createAttendanceClock,
  getAttendanceClock,
  getAttendanceClockShift,
  updateAttendanceClock,
} from '#/api/hrm/attendance/clock';
import { $t } from '#/locales';
import { HrmAttendanceClockType } from '#/views/hrm/utils/constants';
import { formatHrmShiftTimeRange } from '#/views/hrm/utils/format';

import { useClockFormSchema } from '../data';

defineOptions({ name: 'HrmAttendanceClockForm' });

const emit = defineEmits(['success']);

const formType = ref<'create' | 'update'>('create');
const shiftLoading = ref(false);
const shiftInfo = ref<HrmAttendanceClockApi.Shift>();
const formEmployeeId = ref<number>();
const formAttendanceTime = ref<string>();

const showShiftWarning = computed(
  () =>
    !!formEmployeeId.value &&
    !!formAttendanceTime.value &&
    !shiftInfo.value &&
    !shiftLoading.value,
);

const modalTitle = computed(() =>
  formType.value === 'update' ? $t('common.edit') : $t('common.create'),
);

const shiftTimeTip = computed(() => {
  if (!shiftInfo.value) {
    return '';
  }
  const clockInRange = formatHrmShiftTimeRange(
    shiftInfo.value.clockInStartTime,
    shiftInfo.value.clockInEndTime,
  );
  const clockOutRange = formatHrmShiftTimeRange(
    shiftInfo.value.clockOutStartTime,
    shiftInfo.value.clockOutEndTime,
  );
  return `班次 ${formatDate(shiftInfo.value.startTime, 'HH:mm')}-${formatDate(
    shiftInfo.value.endTime,
    'HH:mm',
  )}；上班可打卡 ${clockInRange}；下班可打卡 ${clockOutRange}`;
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    labelWidth: 112,
  },
  layout: 'horizontal',
  schema: useClockFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    if (!shiftInfo.value) {
      message.warning('该员工当天未配置有效班次，不能补录打卡');
      return;
    }
    modalApi.lock();
    try {
      const values = await formApi.getValues();
      const attendanceTime =
        values.type === HrmAttendanceClockType.ON_DUTY
          ? shiftInfo.value.startTime
          : shiftInfo.value.endTime;
      const beginClockTime =
        values.type === HrmAttendanceClockType.ON_DUTY
          ? shiftInfo.value.clockInStartTime
          : shiftInfo.value.clockOutStartTime;
      const endClockTime =
        values.type === HrmAttendanceClockType.ON_DUTY
          ? shiftInfo.value.clockInEndTime
          : shiftInfo.value.clockOutEndTime;
      const clockTime = buildClockTime(
        beginClockTime,
        endClockTime,
        values.attendanceTime,
        values.clockTime,
      );
      if (!clockTime) {
        message.warning(
          `打卡时间需在 ${formatHrmShiftTimeRange(beginClockTime, endClockTime)} 内`,
        );
        return;
      }
      const payload: HrmAttendanceClockApi.AttendanceClock = {
        id: values.id,
        employeeId: values.employeeId,
        type: values.type,
        attendanceTime: dayjs(attendanceTime).valueOf(),
        clockTime: clockTime.getTime(),
        remark: values.remark,
      };
      if (formType.value === 'create') {
        await createAttendanceClock(payload);
        message.success($t('ui.actionMessage.createSuccess'));
      } else {
        await updateAttendanceClock(payload);
        message.success($t('ui.actionMessage.operationSuccess'));
      }
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      shiftInfo.value = undefined;
      return;
    }
    const data = modalApi.getData<{ id?: number; type: 'create' | 'update' }>();
    formType.value = data?.type ?? 'create';
    shiftInfo.value = undefined;
    await formApi.resetForm();
    if (data?.type === 'update' && data.id) {
      modalApi.lock();
      try {
        const detail = await getAttendanceClock(data.id);
        await formApi.setValues({
          ...detail,
          attendanceTime: detail.attendanceTime
            ? String(dayjs(detail.attendanceTime).startOf('day').valueOf())
            : undefined,
          clockTime: detail.clockTime ? String(detail.clockTime) : undefined,
          formType: 'update',
        });
        await loadShift(false);
      } finally {
        modalApi.unlock();
      }
      return;
    }
    await formApi.setValues({
      formType: 'create',
      type: HrmAttendanceClockType.ON_DUTY,
      attendanceTime: String(dayjs().startOf('day').valueOf()),
    });
  },
});

watch(
  () => formApi.form.values,
  async (values, oldValues) => {
    formEmployeeId.value = values.employeeId;
    formAttendanceTime.value = values.attendanceTime;
    if (
      values.employeeId !== oldValues?.employeeId ||
      values.attendanceTime !== oldValues?.attendanceTime ||
      values.type !== oldValues?.type
    ) {
      await loadShift(values.type !== oldValues?.type);
    }
  },
  { deep: true },
);

function buildClockTime(
  beginTime: Date | number | string,
  endTime: Date | number | string,
  attendanceTime?: number | string,
  clockTime?: number | string,
) {
  if (!attendanceTime || !clockTime) {
    return undefined;
  }
  let result = dayjs(
    `${formatDate(attendanceTime, 'YYYY-MM-DD')} ${formatDate(clockTime, 'HH:mm:ss')}`,
  );
  const begin = dayjs(beginTime);
  const end = dayjs(endTime);
  const nextDayClockTime = result.add(1, 'day');
  if (
    result.isBefore(begin) &&
    (nextDayClockTime.isBefore(end) || nextDayClockTime.isSame(end))
  ) {
    result = nextDayClockTime;
  }
  return result.isBefore(begin) || result.isAfter(end)
    ? undefined
    : result.toDate();
}

async function loadShift(applyDefaultTime = false) {
  shiftInfo.value = undefined;
  const values = await formApi.getValues();
  if (!values.employeeId || !values.attendanceTime) {
    return;
  }
  shiftLoading.value = true;
  try {
    shiftInfo.value = await getAttendanceClockShift({
      employeeId: values.employeeId,
      attendanceTime: formatDate(values.attendanceTime),
    });
    if (applyDefaultTime && shiftInfo.value) {
      await formApi.setFieldValue(
        'clockTime',
        String(
          values.type === HrmAttendanceClockType.ON_DUTY
            ? dayjs(shiftInfo.value.startTime).valueOf()
            : dayjs(shiftInfo.value.endTime).valueOf(),
        ),
      );
    }
  } finally {
    shiftLoading.value = false;
  }
}
</script>

<template>
  <Modal :title="modalTitle" class="w-[680px]">
    <Form class="mx-4" />
    <Alert
      v-if="shiftInfo"
      :message="shiftTimeTip"
      class="mx-4 mb-2"
      show-icon
      type="info"
    />
    <Alert
      v-else-if="showShiftWarning"
      class="mx-4 mb-2"
      message="该员工当天未配置有效班次，不能补录打卡"
      show-icon
      type="warning"
    />
  </Modal>
</template>
