<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { OaWorkReportApi } from '#/api/oa/workreport';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  DatePicker,
  Divider,
  Input,
  message,
  Select,
  Slider,
  Table,
} from 'antdv-next';
import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';
import {
  createWorkReport,
  getWorkReport,
  updateWorkReport,
} from '#/api/oa/workreport';
import { $t } from '#/locales';
import { OA_WORK_REPORT_TYPE } from '#/views/oa/utils/constants';
import {
  formatWorkReportWeek,
  getWorkReportWeekOptions,
  getWorkReportWeekStart,
} from '#/views/oa/utils/format';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const formType = ref('create'); // 表单类型：create - 新增；update - 修改；detail - 详情
const reportType = ref<number>(OA_WORK_REPORT_TYPE.DAILY); // 当前汇报类型
const reportWeek = ref(''); // 当前汇报周次
const weekOptions = ref(getWorkReportWeekOptions(dayjs().year())); // 周次选项
const periodValue = ref<number | string>(); // 当前选择的汇报月份时间戳
const workItems = ref<OaWorkReportApi.WorkItem[]>([]); // 已完成工作项
const planItems = ref<OaWorkReportApi.PlanItem[]>([]); // 工作计划项

const readonly = computed(() => formType.value === 'detail'); // 是否只读
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return '工作汇报详情';
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['工作汇报'])
    : $t('ui.actionTitle.create', ['工作汇报']);
});

/** 已完成工作的表格列 */
const workItemColumns = computed(() => {
  const columns: any[] = [
    { key: 'index', title: '序号', width: 60, align: 'center' },
    { key: 'content', title: '工作内容' },
    { key: 'progress', title: '完成进度', width: 260 },
  ];
  if (!readonly.value) {
    columns.push({ key: 'action', title: '操作', width: 80, align: 'center' });
  }
  return columns;
});

/** 工作计划的表格列 */
const planItemColumns = computed(() => {
  const columns: any[] = [
    { key: 'index', title: '序号', width: 60, align: 'center' },
    { key: 'content', title: '计划内容' },
  ];
  if (!readonly.value) {
    columns.push({ key: 'action', title: '操作', width: 80, align: 'center' });
  }
  return columns;
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 96,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const values = (await formApi.getValues()) as OaWorkReportApi.WorkReport;
    // 过滤空白行，工作总结、计划说明与工作明细至少填写一项
    const items = workItems.value.filter((item) => item.content);
    const plans = planItems.value.filter((item) => item.content);
    if (
      !values.summary?.trim() &&
      !values.plan?.trim() &&
      !items.length &&
      !plans.length
    ) {
      message.warning('请填写工作总结、计划说明或工作明细');
      return;
    }
    modalApi.lock();
    try {
      // 统一日期边界为自然日起止，提交由列表单独操作
      const data = {
        ...values,
        startTime: dayjs(Number(values.startTime)).startOf('day').valueOf(),
        endTime: dayjs(Number(values.endTime)).endOf('day').valueOf(),
        workItems: items,
        planItems: plans,
      };
      if (formType.value === 'create') {
        await createWorkReport(data);
      } else {
        await updateWorkReport(data);
      }
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as {
      formType: string;
      id?: number;
      reportType?: number;
    };
    formType.value = data.formType || 'create';
    reportType.value = data.reportType || OA_WORK_REPORT_TYPE.DAILY;
    workItems.value = [];
    planItems.value = [];
    await formApi.setState({ commonConfig: { disabled: readonly.value } });

    if (!data.id) {
      // 新增时初始化汇报周期：日报覆盖当天、周报覆盖当周、月报覆盖整月
      const [startTime, endTime] = getDefaultPeriodTime(reportType.value);
      periodValue.value = startTime;
      reportWeek.value = formatWorkReportWeek(startTime);
      weekOptions.value = getWorkReportWeekOptions(
        Number(reportWeek.value.split('-')[0]),
      );
      await formApi.setValues({
        id: undefined,
        type: reportType.value,
        title: '',
        startTime,
        endTime,
        summary: '',
        plan: '',
        problem: '',
        remark: '',
        fileUrls: [],
      });
      return;
    }
    // 修改或查看时，加载工作汇报详情
    modalApi.lock();
    try {
      const detail = await getWorkReport(data.id);
      reportType.value = detail.type;
      workItems.value = detail.workItems || [];
      planItems.value = detail.planItems || [];
      // 日期控件使用时间戳格式，回填时转换日期值
      const startTime = dayjs(detail.startTime).valueOf();
      const endTime = dayjs(detail.endTime).valueOf();
      periodValue.value = startTime;
      reportWeek.value = formatWorkReportWeek(startTime);
      weekOptions.value = getWorkReportWeekOptions(
        Number(reportWeek.value.split('-')[0]),
      );
      await formApi.setValues({ ...detail, startTime, endTime });
    } finally {
      modalApi.unlock();
    }
  },
});

/** 获得默认汇报周期：日报覆盖当天、周报覆盖周一至周日、月报覆盖整月 */
function getDefaultPeriodTime(type: number): [number, number] {
  const currentTime = dayjs();
  if (type === OA_WORK_REPORT_TYPE.WEEKLY) {
    const weekDay = currentTime.day() === 0 ? 7 : currentTime.day();
    const weekStartTime = currentTime
      .subtract(weekDay - 1, 'day')
      .startOf('day');
    return [
      weekStartTime.valueOf(),
      weekStartTime.add(6, 'day').endOf('day').valueOf(),
    ];
  }
  if (type === OA_WORK_REPORT_TYPE.MONTHLY) {
    return [
      currentTime.startOf('month').valueOf(),
      currentTime.endOf('month').valueOf(),
    ];
  }
  return [
    currentTime.startOf('day').valueOf(),
    currentTime.endOf('day').valueOf(),
  ];
}

/** 选择周次时初始化日期，之后仍可手动调整 */
function handleWeekChange(value: string) {
  const startTime = getWorkReportWeekStart(value);
  formApi.setValues({
    startTime: startTime.startOf('day').valueOf(),
    endTime: startTime.add(6, 'day').endOf('day').valueOf(),
  });
}

/** 选择月份时初始化日期，之后仍可手动调整 */
function handleMonthChange(value: Dayjs | Dayjs[] | null | number | string) {
  const date = dayjs(Number(value));
  formApi.setValues({
    startTime: date.startOf('month').valueOf(),
    endTime: date.endOf('month').valueOf(),
  });
}

/** 新增已完成工作项 */
function addWorkItem() {
  workItems.value.push({ content: '', progress: 0 });
}

/** 删除已完成工作项 */
function removeWorkItem(index: number) {
  workItems.value.splice(index, 1);
}

/** 新增工作计划项 */
function addPlanItem() {
  planItems.value.push({ content: '' });
}

/** 删除工作计划项 */
function removePlanItem(index: number) {
  planItems.value.splice(index, 1);
}
</script>

<template>
  <Modal :title="getTitle" class="w-[1080px]" :show-confirm-button="!readonly">
    <div class="max-h-[70vh] overflow-y-auto px-4">
      <!-- 汇报周期 -->
      <div
        v-if="reportType === OA_WORK_REPORT_TYPE.WEEKLY"
        class="mb-4 flex items-center gap-2"
      >
        <span class="w-[96px] shrink-0 text-right">汇报周次</span>
        <Select
          v-model:value="reportWeek"
          class="flex-1"
          :disabled="readonly"
          :options="weekOptions"
          @change="handleWeekChange"
        />
      </div>
      <div
        v-if="reportType === OA_WORK_REPORT_TYPE.MONTHLY"
        class="mb-4 flex items-center gap-2"
      >
        <span class="w-[96px] shrink-0 text-right">汇报月份</span>
        <DatePicker
          v-model:value="periodValue"
          class="flex-1"
          :disabled="readonly"
          :allow-clear="false"
          picker="month"
          value-format="x"
          @change="handleMonthChange"
        />
      </div>

      <!-- 基本信息 -->
      <Form />

      <!-- 已完成工作 -->
      <Divider title-placement="left">已完成工作</Divider>
      <Table
        bordered
        :columns="workItemColumns"
        :data-source="workItems"
        :pagination="false"
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.key === 'content'">
            <Input
              v-if="!readonly"
              v-model:value="record.content"
              :maxlength="1000"
              placeholder="请输入已完成的工作内容"
            />
            <span v-else>{{ record.content }}</span>
          </template>
          <template v-else-if="column.key === 'progress'">
            <div class="flex items-center gap-3">
              <Slider
                v-if="!readonly"
                v-model:value="record.progress"
                :step="10"
                class="flex-1"
              />
              <span class="w-[42px] text-right">{{ record.progress }}%</span>
            </div>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button danger type="link" @click="removeWorkItem(index)">
              删除
            </Button>
          </template>
        </template>
      </Table>
      <Button
        v-if="!readonly"
        :disabled="workItems.length >= 100"
        class="mt-3"
        @click="addWorkItem"
      >
        <IconifyIcon class="mr-1" icon="lucide:plus" />新增工作项
      </Button>

      <!-- 工作计划 -->
      <Divider title-placement="left">工作计划</Divider>
      <Table
        bordered
        :columns="planItemColumns"
        :data-source="planItems"
        :pagination="false"
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.key === 'content'">
            <Input
              v-if="!readonly"
              v-model:value="record.content"
              :maxlength="1000"
              placeholder="请输入下一阶段工作计划"
            />
            <span v-else>{{ record.content }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button danger type="link" @click="removePlanItem(index)">
              删除
            </Button>
          </template>
        </template>
      </Table>
      <Button
        v-if="!readonly"
        :disabled="planItems.length >= 100"
        class="mt-3"
        @click="addPlanItem"
      >
        <IconifyIcon class="mr-1" icon="lucide:plus" />新增计划项
      </Button>
    </div>
  </Modal>
</template>
