<script lang="ts" setup>
import type { HrmAttendanceGroupApi } from '#/api/hrm/attendance/group';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElAlert,
  ElCheckbox,
  ElCheckboxGroup,
  ElForm,
  ElFormItem,
  ElTimePicker,
} from 'element-plus';

import { HRM_WEEK_OPTIONS } from '#/views/hrm/utils/constants';
import { formatHrmAttendanceShiftDuration } from '#/views/hrm/utils/format';

defineOptions({ name: 'HrmAttendanceGroupShiftForm' });

const emit = defineEmits<{
  confirm: [shift: HrmAttendanceGroupApi.Shift, index?: number];
}>();

const editIndex = ref<number>();
const formRef = ref();
const formData = ref<HrmAttendanceGroupApi.Shift>(createDefault());

const clockInTimeRange = computed<[string, string] | undefined>({
  get: () =>
    buildTimeRange(
      formData.value.clockInStartTime,
      formData.value.clockInEndTime,
    ),
  set: (value) => {
    formData.value.clockInStartTime = value?.[0] || '';
    formData.value.clockInEndTime = value?.[1] || '';
  },
});

const clockOutTimeRange = computed<[string, string] | undefined>({
  get: () =>
    buildTimeRange(
      formData.value.clockOutStartTime,
      formData.value.clockOutEndTime,
    ),
  set: (value) => {
    formData.value.clockOutStartTime = value?.[0] || '';
    formData.value.clockOutEndTime = value?.[1] || '';
  },
});

const restTimeRange = computed<[string, string] | undefined>({
  get: () =>
    buildTimeRange(formData.value.restStartTime, formData.value.restEndTime),
  set: (value) => {
    formData.value.restStartTime = value?.[0] || '';
    formData.value.restEndTime = value?.[1] || '';
  },
});

const formRules = reactive({
  weeks: [{ required: true, message: '工作日不能为空', trigger: 'change' }],
  startTime: [
    { required: true, message: '上班时间不能为空', trigger: 'change' },
  ],
  endTime: [{ required: true, message: '下班时间不能为空', trigger: 'change' }],
  clockInTimeRange: [
    {
      validator: async () => {
        if (clockInTimeRange.value?.[0] && clockInTimeRange.value?.[1]) return;
        throw new Error('上班打卡时间段不能为空');
      },
      trigger: 'change',
    },
  ],
  clockOutTimeRange: [
    {
      validator: async () => {
        if (clockOutTimeRange.value?.[0] && clockOutTimeRange.value?.[1])
          return;
        throw new Error('下班打卡时间段不能为空');
      },
      trigger: 'change',
    },
  ],
  restTimeRange: [
    {
      validator: async () => {
        if (restTimeRange.value?.[0] && restTimeRange.value?.[1]) return;
        throw new Error('休息时间不能为空');
      },
      trigger: 'change',
    },
  ],
});

function buildTimeRange(startTime?: string, endTime?: string) {
  return startTime && endTime
    ? ([startTime, endTime] as [string, string])
    : undefined;
}

function createDefault(): HrmAttendanceGroupApi.Shift {
  return {
    weeks: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '18:00',
    clockInStartTime: '05:00',
    clockInEndTime: '17:59',
    clockOutStartTime: '09:01',
    clockOutEndTime: '04:59',
    restStartTime: '12:00',
    restEndTime: '13:00',
    excludeRestTime: false,
  };
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
    emit(
      'confirm',
      {
        ...formData.value,
        weeks: [...formData.value.weeks].toSorted((a, b) => a - b),
      },
      editIndex.value,
    );
    await modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const payload = modalApi.getData<{
      index?: number;
      shift?: HrmAttendanceGroupApi.Shift;
    }>();
    editIndex.value = payload?.index;
    formData.value = payload?.shift
      ? { ...payload.shift, weeks: [...payload.shift.weeks] }
      : createDefault();
  },
});

defineExpose({
  open(shift?: HrmAttendanceGroupApi.Shift, index?: number) {
    modalApi.setData({ shift, index }).open();
  },
});
</script>

<template>
  <Modal
    :title="editIndex === undefined ? '新增班次' : '编辑班次'"
    class="w-[760px]"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-position="top"
    >
      <ElFormItem label="工作日" prop="weeks">
        <ElCheckboxGroup v-model="formData.weeks">
          <ElCheckbox
            v-for="item in HRM_WEEK_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </ElCheckbox>
        </ElCheckboxGroup>
      </ElFormItem>
      <ElAlert
        :closable="false"
        class="mb-4"
        show-icon
        title="打卡窗口需覆盖对应的上下班时间；结束时间早于开始时间时按次日计算，例如 18:00 至次日 04:59。"
        type="info"
      />
      <div class="grid grid-cols-2 gap-4">
        <ElFormItem label="上班时间" prop="startTime">
          <ElTimePicker
            v-model="formData.startTime"
            class="!w-full"
            format="HH:mm"
            value-format="HH:mm"
          />
        </ElFormItem>
        <ElFormItem label="下班时间" prop="endTime">
          <ElTimePicker
            v-model="formData.endTime"
            class="!w-full"
            format="HH:mm"
            value-format="HH:mm"
          />
        </ElFormItem>
      </div>
      <ElFormItem label="上班打卡时间段" prop="clockInTimeRange">
        <ElTimePicker
          v-model="clockInTimeRange"
          class="!w-full"
          end-placeholder="结束时间"
          format="HH:mm"
          is-range
          range-separator="至"
          start-placeholder="开始时间"
          value-format="HH:mm"
        />
      </ElFormItem>
      <ElFormItem label="下班打卡时间段" prop="clockOutTimeRange">
        <ElTimePicker
          v-model="clockOutTimeRange"
          class="!w-full"
          end-placeholder="结束时间"
          format="HH:mm"
          is-range
          range-separator="至"
          start-placeholder="开始时间"
          value-format="HH:mm"
        />
      </ElFormItem>
      <ElFormItem label="休息时间" prop="restTimeRange">
        <div class="flex w-full items-center gap-4">
          <ElTimePicker
            v-model="restTimeRange"
            class="!flex-1"
            end-placeholder="结束时间"
            format="HH:mm"
            is-range
            range-separator="至"
            start-placeholder="开始时间"
            value-format="HH:mm"
          />
          <ElCheckbox v-model="formData.excludeRestTime">
            不计入工作时长
          </ElCheckbox>
        </div>
      </ElFormItem>
      <ElFormItem label="合计工作时长">
        <span>{{ formatHrmAttendanceShiftDuration(formData) }}</span>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
