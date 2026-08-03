<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { HrmHomeApi } from '#/api/hrm/home';

import { computed, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';
import {
  ElButton,
  ElCalendar,
  ElCard,
  ElEmpty,
  ElMessage,
  ElTag,
} from 'element-plus';

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

/** ElCalendar v-model 桥接：内部用 Dayjs，组件需要 Date */
const calendarValue = computed({
  get: () => calendarDate.value.toDate(),
  set: (val: Date) => {
    calendarDate.value = dayjs(val);
  },
});

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
function selectDate(day: string) {
  selectedDate.value = day;
  calendarDate.value = dayjs(day);
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
  ElMessage.success('删除成功');
  await refreshCalendar();
}

/** 获取日历事项标签类型 */
function eventTagType(type: number) {
  switch (type) {
    case HrmHomeCalendarItemType.BIRTHDAY: {
      return 'danger';
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
      return 'primary';
    }
    default: {
      return 'info';
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
  <ElCard header="日历" class="calendar-panel">
    <PersonalNoteFormModal @success="refreshCalendar" />
    <div v-loading="loading">
      <ElCalendar v-model="calendarValue" class="hrm-home-calendar">
        <template #header>
          <div class="mb-2 flex w-full items-center justify-between px-1">
            <div class="text-sm font-medium">
              {{ calendarDate.format('YYYY 年 MM 月') }}
            </div>
            <div class="flex items-center gap-1">
              <ElButton size="small" @click="handlePrevMonth">上月</ElButton>
              <ElButton size="small" @click="handleToday">今天</ElButton>
              <ElButton size="small" @click="handleNextMonth">下月</ElButton>
            </div>
          </div>
        </template>
        <template #date-cell="{ data }">
          <div
            class="relative flex h-[42px] w-full flex-col items-center justify-center rounded"
            :class="{
              'bg-primary/15 text-primary': data.day === selectedDate,
              'text-muted-foreground':
                data.day !== selectedDate && data.type !== 'current-month',
            }"
            @click.stop="selectDate(data.day)"
          >
            <span class="leading-[18px]">{{ data.day.split('-')[2] }}</span>
            <span
              class="max-w-full truncate text-[10px] leading-[14px]"
              :class="
                data.day === selectedDate
                  ? 'text-primary/80'
                  : 'text-muted-foreground'
              "
            >
              {{ getHrmLunarDateInfo(data.day).dayText }}
            </span>
            <i
              v-if="calendarDateSet.has(data.day)"
              class="bg-primary absolute bottom-[3px] right-[3px] h-[5px] w-[5px] rounded-full"
            ></i>
          </div>
        </template>
      </ElCalendar>

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
        <ElButton
          v-if="hasAccessByCodes(['hrm:employee:personal-note:create'])"
          class="ml-auto"
          link
          type="primary"
          @click="openPersonalNoteForm"
        >
          <IconifyIcon icon="lucide:plus" class="mr-1" />
          添加备忘录
        </ElButton>
      </div>

      <div class="mt-[18px] font-semibold">当天事项</div>
      <div class="mt-2 min-h-[132px]">
        <div
          v-for="item in visibleDayItems"
          :key="`${item.type}-${item.personalNoteId || item.typeId || item.content}`"
          class="flex min-h-8 items-center gap-2"
        >
          <ElTag :type="eventTagType(item.type)" size="small">
            {{ item.typeName }}
          </ElTag>
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
          <ElButton
            v-if="
              item.personalNoteId &&
              hasAccessByCodes(['hrm:employee:personal-note:delete'])
            "
            type="danger"
            link
            @click="handleDeletePersonalNote(item.personalNoteId)"
          >
            删除
          </ElButton>
        </div>
        <ElButton
          v-if="dayItems.length > 4 && !showAllEvents"
          link
          type="primary"
          @click="showAllEvents = true"
        >
          查看更多事项
        </ElButton>
        <ElEmpty
          v-if="dayItems.length === 0"
          class="py-3"
          :image-size="48"
          description="暂无数据"
        />
      </div>
    </div>
  </ElCard>
</template>

<style lang="scss" scoped>
.hrm-home-calendar {
  :deep(.el-calendar__body) {
    padding: 8px 0 0;
  }

  :deep(.el-calendar-table thead th) {
    padding: 4px 0;
    font-weight: 500;
    text-align: center;
  }

  :deep(.el-calendar-table td) {
    border: none;
  }

  :deep(.el-calendar-table .el-calendar-day) {
    height: 48px;
    padding: 2px;
  }

  /* 去掉 ElCalendar 默认选中背景，只保留自定义单元格高亮 */
  :deep(.el-calendar-table td.is-selected),
  :deep(.el-calendar-table td.is-today) {
    background: transparent;
  }

  :deep(.el-calendar-table .el-calendar-day:hover) {
    background: transparent;
  }
}
</style>
