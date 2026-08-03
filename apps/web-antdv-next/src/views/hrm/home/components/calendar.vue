<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { HrmHomeApi } from '#/api/hrm/home';

import { computed, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Calendar, Card, Empty, message, Spin, Tag } from 'antdv-next';
import dayjs from 'dayjs';

import { deleteEmployeePersonalNote } from '#/api/hrm/employee/personal-note';
import { $t } from '#/locales';
import { HrmHomeCalendarItemType } from '#/views/hrm/utils/constants';
import { getHrmLunarDateInfo } from '#/views/hrm/utils/format';

import PersonalNoteForm from './personal-note-form.vue';

import 'dayjs/locale/zh-cn';

defineOptions({ name: 'HrmHomeCalendar' });

const props = defineProps<{
  getCalendarItems: (params: {
    endDate: string;
    startDate: string;
  }) => Promise<HrmHomeApi.HomeCalendarItem[]>;
  isItemClickable?: (item: HrmHomeApi.HomeCalendarItem) => boolean;
  itemFilter?: (item: HrmHomeApi.HomeCalendarItem) => boolean;
  showItemTime?: (item: HrmHomeApi.HomeCalendarItem) => boolean;
}>();

const emit = defineEmits<{
  itemClick: [item: HrmHomeApi.HomeCalendarItem];
}>();

dayjs.locale('zh-cn');

const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const calendarDate = ref<Dayjs>(dayjs());
const selectedDate = ref(dayjs().format('YYYY-MM-DD'));
const calendarItems = ref<HrmHomeApi.HomeCalendarItem[]>([]);
const showAllEvents = ref(false);

const [PersonalNoteFormModal, personalNoteFormModalApi] = useVbenModal({
  connectedComponent: PersonalNoteForm,
  destroyOnClose: true,
});

const calendarDateSet = computed(
  () => new Set(calendarItems.value.map((item) => item.date)),
);
const dayItems = computed(() =>
  calendarItems.value.filter((item) => item.date === selectedDate.value),
);
const visibleDayItems = computed(() =>
  showAllEvents.value ? dayItems.value : dayItems.value.slice(0, 4),
);

/** 刷新当前月份的日历 */
async function refreshCalendar() {
  loading.value = true;
  try {
    const month = calendarDate.value;
    const items = await props.getCalendarItems({
      endDate: month.endOf('month').format('YYYY-MM-DD'),
      startDate: month.startOf('month').format('YYYY-MM-DD'),
    });
    calendarItems.value = props.itemFilter
      ? items.filter((item) => props.itemFilter!(item))
      : items;
  } finally {
    loading.value = false;
  }
}
defineExpose({ refresh: refreshCalendar });

/** 选择日期 */
function selectDate(date: unknown) {
  const current = dayjs(date as Dayjs);
  selectedDate.value = current.format('YYYY-MM-DD');
  calendarDate.value = current;
  showAllEvents.value = false;
}

/** 是否可打开日历事项 */
function canOpenItem(item: HrmHomeApi.HomeCalendarItem) {
  return props.isItemClickable?.(item) === true;
}

/** 是否展示事项时间 */
function shouldShowItemTime(item: HrmHomeApi.HomeCalendarItem) {
  return (
    !!item.eventTime && (props.showItemTime ? props.showItemTime(item) : true)
  );
}

/** 日历事项点击操作 */
function handleItemClick(item: HrmHomeApi.HomeCalendarItem) {
  if (canOpenItem(item)) {
    emit('itemClick', item);
  }
}

/** 打开新增备忘弹窗 */
function openPersonalNoteForm() {
  personalNoteFormModalApi.setData({ date: selectedDate.value }).open();
}

/** 删除个人备忘 */
async function handleDeletePersonalNote(id: number) {
  await confirm($t('ui.actionMessage.deleteConfirm', ['备忘']));
  await deleteEmployeePersonalNote(id);
  message.success('删除成功');
  await refreshCalendar();
}

/** 获取日历事项标签颜色 */
function eventTagColor(type: number) {
  switch (type) {
    case HrmHomeCalendarItemType.BIRTHDAY: {
      return 'error';
    }
    case HrmHomeCalendarItemType.ENTRY:
    case HrmHomeCalendarItemType.REGULAR: {
      return 'success';
    }
    case HrmHomeCalendarItemType.LEAVE: {
      return 'warning';
    }
    case HrmHomeCalendarItemType.NOTE:
    case HrmHomeCalendarItemType.RECRUIT: {
      return 'processing';
    }
    default: {
      return 'default';
    }
  }
}

/** 格式化事项时间 */
function formatItemTime(eventTime?: Date | number | string) {
  return eventTime ? dayjs(eventTime).format('HH:mm') : '';
}

/** 切换到上月 */
function handlePrevMonth() {
  calendarDate.value = calendarDate.value.subtract(1, 'month');
}

/** 切换到下月 */
function handleNextMonth() {
  calendarDate.value = calendarDate.value.add(1, 'month');
}

/** 切换到今天 */
function handleToday() {
  const today = dayjs();
  calendarDate.value = today;
  selectedDate.value = today.format('YYYY-MM-DD');
  showAllEvents.value = false;
}

/** 监听月份切换，重新加载当月数据 */
watch(calendarDate, async (date, oldDate) => {
  selectedDate.value = date.format('YYYY-MM-DD');
  showAllEvents.value = false;
  if (!oldDate || !date.isSame(oldDate, 'month')) {
    await refreshCalendar();
  }
});
</script>

<template>
  <Card title="日历" class="calendar-panel">
    <PersonalNoteFormModal @success="refreshCalendar" />
    <Spin :spinning="loading">
      <Calendar
        v-model:value="calendarDate"
        class="hrm-home-calendar"
        :fullscreen="false"
      >
        <template #headerRender>
          <div class="mb-2 flex items-center justify-between px-1">
            <div class="text-sm font-medium">
              {{ calendarDate.format('YYYY 年 MM 月') }}
            </div>
            <div class="flex items-center gap-1">
              <Button size="small" @click="handlePrevMonth">
                {{ '上\u200c月' }}
              </Button>
              <Button size="small" @click="handleToday">
                {{ '今\u200c天' }}
              </Button>
              <Button size="small" @click="handleNextMonth">
                {{ '下\u200c月' }}
              </Button>
            </div>
          </div>
        </template>
        <template #fullCellRender="{ date }">
          <div
            class="relative flex h-[42px] w-full flex-col items-center justify-center rounded"
            :class="{
              'bg-primary/15 text-primary':
                date.format('YYYY-MM-DD') === selectedDate,
              'text-muted-foreground':
                date.format('YYYY-MM-DD') !== selectedDate &&
                !date.isSame(calendarDate, 'month'),
            }"
            @click.stop="selectDate(date)"
          >
            <span class="leading-[18px]">{{ date.format('DD') }}</span>
            <span
              class="max-w-full truncate text-[10px] leading-[14px]"
              :class="
                date.format('YYYY-MM-DD') === selectedDate
                  ? 'text-primary/80'
                  : 'text-muted-foreground'
              "
            >
              {{ getHrmLunarDateInfo(date.format('YYYY-MM-DD')).dayText }}
            </span>
            <i
              v-if="calendarDateSet.has(date.format('YYYY-MM-DD'))"
              class="bg-primary absolute bottom-[3px] right-[3px] h-[5px] w-[5px] rounded-full"
            ></i>
          </div>
        </template>
      </Calendar>

      <div class="bg-muted mt-4 flex items-center rounded px-3.5 py-2.5">
        <div class="mr-2.5 text-[38px] font-bold leading-none">
          {{ dayjs(selectedDate).format('DD') }}
        </div>
        <div>
          <div>{{ dayjs(selectedDate).format('dddd') }}</div>
          <div class="text-muted-foreground mt-1 text-xs">
            {{ getHrmLunarDateInfo(selectedDate).monthDayText }}
          </div>
        </div>
        <Button
          v-if="hasAccessByCodes(['hrm:employee:personal-note:create'])"
          class="ml-auto"
          type="link"
          @click="openPersonalNoteForm"
        >
          <IconifyIcon icon="lucide:plus" class="mr-1" />
          添加备忘录
        </Button>
      </div>

      <div class="mt-[18px] font-semibold">当天事项</div>
      <div class="mt-2 min-h-[132px]">
        <div
          v-for="item in visibleDayItems"
          :key="`${item.type}-${item.personalNoteId || item.typeId || item.content}`"
          class="flex min-h-8 items-center gap-2"
        >
          <Tag :color="eventTagColor(item.type)">
            {{ item.typeName }}
          </Tag>
          <span
            v-if="shouldShowItemTime(item)"
            class="text-muted-foreground flex-none text-xs tabular-nums"
          >
            {{ formatItemTime(item.eventTime) }}
          </span>
          <button
            class="min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-left font-inherit"
            :class="
              canOpenItem(item)
                ? 'text-primary cursor-pointer hover:underline'
                : 'cursor-default'
            "
            type="button"
            @click="handleItemClick(item)"
          >
            {{ item.content }}
          </button>
          <Button
            v-if="
              item.personalNoteId &&
              hasAccessByCodes(['hrm:employee:personal-note:delete'])
            "
            danger
            type="link"
            @click="handleDeletePersonalNote(item.personalNoteId)"
          >
            删除
          </Button>
        </div>
        <Button
          v-if="dayItems.length > 4 && !showAllEvents"
          type="link"
          @click="showAllEvents = true"
        >
          查看更多事项
        </Button>
        <Empty
          v-if="dayItems.length === 0"
          class="py-3"
          :image-style="{ height: '48px' }"
          description="暂无数据"
        />
      </div>
    </Spin>
  </Card>
</template>

<style lang="scss" scoped>
.hrm-home-calendar {
  :deep(.ant-picker-panel) {
    border-top: none;
  }

  :deep(.ant-picker-content) {
    th {
      padding: 4px 0;
      font-weight: 500;
      text-align: center;
    }

    td {
      padding: 0;
    }
  }

  :deep(.ant-picker-cell) {
    padding: 0;

    &::before {
      display: none;
    }
  }

  /* 去掉 antd 默认选中圆点/背景，只保留自定义单元格高亮 */
  :deep(.ant-picker-cell-selected .ant-picker-cell-inner),
  :deep(.ant-picker-cell-selected::before) {
    background: transparent !important;
  }

  :deep(.ant-picker-calendar-date) {
    padding: 0;
    margin: 0;
    background: transparent !important;
    border-top: none !important;
  }
}
</style>
