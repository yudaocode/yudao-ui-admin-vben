<script lang="ts" setup>
import type { PmsIterationApi } from '#/api/pms/pm/iteration';
import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';

import { computed, onMounted, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { getAllPageItems } from '@vben/utils';

import dayjs from 'dayjs';
import {
  ElButton,
  ElDatePicker,
  ElEmpty,
  ElInput,
  ElOption,
  ElPopover,
  ElSelect,
} from 'element-plus';

import { getIterationPage } from '#/api/pms/pm/iteration';
import { getWorkItemPage } from '#/api/pms/pm/workitem';
import { PmsProjectType } from '#/views/pms/pm/utils/constants';
import WorkItemDetail from '#/views/pms/pm/workitem/detail/work-item-detail.vue';

defineOptions({ name: 'PmsProjectGantt' });

// TODO @AI：甘特可以保留自定义；antd/antdv-next 不要用 v-loading。日期格式抽到 format.ts。三端行数差一截，对齐交互。

const props = defineProps<{
  editable: boolean;
  projectId: number;
  projectType: number;
}>();

interface GanttRow {
  depth: number;
  endTime: number;
  group: boolean;
  item?: PmsWorkItemApi.WorkItem;
  key: string;
  name: string;
  parentKey?: string;
  progress: number;
  startTime: number;
}

type ViewMode = 'Day' | 'Month' | 'Week' | 'Year';

const loading = ref(false); // 加载中
const items = ref<PmsWorkItemApi.WorkItem[]>([]); // 工作项列表
const iterationList = ref<PmsIterationApi.Iteration[]>([]); // 项目迭代列表
const keyword = ref(''); // 搜索关键词
const dateRange = ref<[any, any]>(); // 时间轴日期范围
const viewMode = ref<ViewMode>('Day'); // 时间轴视图模式
const viewModeOptions = [
  { label: '日视图', value: 'Day' },
  { label: '周视图', value: 'Week' },
  { label: '月视图', value: 'Month' },
  { label: '年视图', value: 'Year' },
] as const; // 甘特图视图模式选项
const timelineUnitMap = {
  Day: 'day',
  Week: 'week',
  Month: 'month',
  Year: 'year',
} as const; // 甘特图时间单位映射
const collapsedKeys = reactive(new Set<string>()); // 已折叠的迭代或父事项
const allDatedItems = computed(() =>
  items.value.filter((item) => item.startTime && item.endTime),
); // 已设置时间范围的工作项
const rows = computed(() => buildRows()); // 全部甘特图行
const visibleRows = computed(() => {
  const rowMap = new Map(rows.value.map((row) => [row.key, row]));
  return rows.value.filter((row) => {
    let parentKey = row.parentKey;
    while (parentKey) {
      if (collapsedKeys.has(parentKey)) return false;
      parentKey = rowMap.get(parentKey)?.parentKey;
    }
    return true;
  });
}); // 展开状态下的可见行
const datedRows = computed(() =>
  visibleRows.value.filter(
    (row) => row.endTime >= beginTime.value && row.startTime <= endTime.value,
  ),
); // 时间范围内的展示行
const beginTime = computed(() =>
  dateRange.value
    ? dayjs(dateRange.value[0]).startOf('day').valueOf()
    : Math.min(...rows.value.map((row) => row.startTime)),
); // 时间轴开始时间
const endTime = computed(() =>
  dateRange.value
    ? dayjs(dateRange.value[1]).endOf('day').valueOf()
    : Math.max(...rows.value.map((row) => row.endTime)),
); // 时间轴结束时间
const totalDuration = computed(() =>
  Math.max(1, endTime.value - beginTime.value),
); // 时间轴总时长
const timelineUnit = computed(() => timelineUnitMap[viewMode.value]); // 时间轴刻度单位
const timelineWidth = computed(() => {
  const unitCount = Math.max(
    1,
    dayjs(endTime.value).diff(dayjs(beginTime.value), timelineUnit.value) + 1,
  );
  const unitWidth = { Day: 44, Week: 76, Month: 96, Year: 128 }[viewMode.value];
  return Math.max(620, Math.min(12_000, unitCount * unitWidth));
}); // 时间轴宽度
const timelineTicks = computed(() => {
  const ticks: Array<{ label: string; left: number; time: number }> = [];
  const unit = timelineUnit.value;
  const format = {
    Day: 'MM-DD',
    Week: 'MM-DD',
    Month: 'YYYY-MM',
    Year: 'YYYY',
  }[viewMode.value];
  let currentTime = dayjs(beginTime.value).startOf(unit);
  let guard = 0;
  while (currentTime.valueOf() <= endTime.value && guard < 160) {
    ticks.push({
      time: currentTime.valueOf(),
      label: currentTime.format(format),
      left:
        ((currentTime.valueOf() - beginTime.value) / totalDuration.value) * 100,
    });
    currentTime = currentTime.add(1, unit);
    guard += 1;
  }
  return ticks;
}); // 时间轴刻度
const todayPosition = computed(() =>
  Math.min(
    100,
    Math.max(
      0,
      ((dayjs().valueOf() - beginTime.value) / totalDuration.value) * 100,
    ),
  ),
); // 今天所在位置百分比

const [WorkItemDetailDrawer, workItemDetailDrawerApi] = useVbenDrawer({
  connectedComponent: WorkItemDetail,
});

/** 查询甘特图数据 */
async function getGanttData() {
  loading.value = true;
  try {
    // 并行加载页面所需数据
    const [workItems, projectIterations] = await Promise.all([
      getAllPageItems<PmsWorkItemApi.WorkItem>((pageNo, pageSize) =>
        getWorkItemPage({ pageNo, pageSize, projectId: props.projectId }),
      ),
      props.projectType === PmsProjectType.AGILE
        ? getAllPageItems<PmsIterationApi.Iteration>((pageNo, pageSize) =>
            getIterationPage({ pageNo, pageSize, projectId: props.projectId }),
          )
        : Promise.resolve([]),
    ]);
    items.value = workItems;
    iterationList.value = projectIterations;
    resetRange();
  } finally {
    loading.value = false;
  }
}

/** 构建甘特图行 */
function buildRows() {
  const searchKeyword = keyword.value.trim();
  if (props.projectType !== PmsProjectType.AGILE) {
    return buildItemRows(
      allDatedItems.value.filter(
        (item) => !searchKeyword || item.name.includes(searchKeyword),
      ),
      0,
    );
  }
  const result: GanttRow[] = [];
  iterationList.value.forEach((iteration) => {
    const iterationMatched =
      !searchKeyword || iteration.name.includes(searchKeyword);
    const iterationItems = allDatedItems.value.filter(
      (item) =>
        item.iterationId === iteration.id &&
        (iterationMatched || item.name.includes(searchKeyword)),
    );
    if (iterationItems.length === 0) {
      return;
    }
    // 迭代缺少日期时，使用其下已有日期事项推导分组范围，避免整组事项被隐藏。
    const iterationStartTime = iteration.startTime
      ? Number(iteration.startTime)
      : Math.min(...iterationItems.map((item) => Number(item.startTime)));
    const iterationEndTime = iteration.endTime
      ? Number(iteration.endTime)
      : Math.max(...iterationItems.map((item) => Number(item.endTime)));
    result.push({
      key: `iteration-${iteration.id}`,
      name: iteration.name,
      startTime: iterationStartTime,
      endTime: iterationEndTime,
      progress: 0,
      depth: 0,
      group: true,
    });
    result.push(
      ...buildItemRows(iterationItems, 1, `iteration-${iteration.id}`),
    );
  });
  const unplannedItems = allDatedItems.value.filter(
    (item) =>
      !item.iterationId &&
      (!searchKeyword || item.name.includes(searchKeyword)),
  );
  if (unplannedItems.length) {
    result.push({
      key: 'iteration-unplanned',
      name: '未规划事项',
      startTime: Math.min(
        ...unplannedItems.map((item) => Number(item.startTime)),
      ),
      endTime: Math.max(...unplannedItems.map((item) => Number(item.endTime))),
      progress: 0,
      depth: 0,
      group: true,
    });
    result.push(...buildItemRows(unplannedItems, 1, 'iteration-unplanned'));
  }
  return result;
}

/** 递归构建工作项层级行 */
function buildItemRows(
  source: PmsWorkItemApi.WorkItem[],
  baseDepth: number,
  parentGroupKey?: string,
) {
  const result: GanttRow[] = [];
  const idSet = new Set(source.map((item) => item.id));
  const appendChildren = (
    parentId: number | undefined,
    depth: number,
    parentKey?: string,
  ) => {
    source
      .filter((item) =>
        parentId
          ? item.parentId === parentId
          : !item.parentId || !idSet.has(item.parentId),
      )
      .forEach((item) => {
        result.push({
          key: `item-${item.id}`,
          name: item.name,
          startTime: Number(item.startTime),
          endTime: Number(item.endTime),
          progress: item.progress ?? 0,
          depth,
          group: false,
          parentKey,
          item,
        });
        appendChildren(item.id, depth + 1, `item-${item.id}`);
      });
  };
  appendChildren(undefined, baseDepth, parentGroupKey);
  return result;
}

/** 判断甘特图行是否存在子行 */
function hasChildren(key: string) {
  return rows.value.some((row) => row.parentKey === key);
}

/** 折叠或展开甘特图行 */
function toggleRow(key: string) {
  if (collapsedKeys.has(key)) {
    collapsedKeys.delete(key);
  } else {
    collapsedKeys.add(key);
  }
}

/** 重置时间轴范围 */
function resetRange() {
  if (allDatedItems.value.length === 0) {
    dateRange.value = undefined;
    return;
  }
  dateRange.value = [
    dayjs(
      Math.min(...allDatedItems.value.map((item) => Number(item.startTime))),
    ),
    dayjs(Math.max(...allDatedItems.value.map((item) => Number(item.endTime)))),
  ];
}

/** 获得甘特条左偏移百分比 */
function getBarLeft(row: GanttRow) {
  return Math.max(
    0,
    ((row.startTime - beginTime.value) / totalDuration.value) * 100,
  );
}

/** 获得甘特条可见宽度百分比 */
function getBarWidth(row: GanttRow) {
  const visibleStart = Math.max(row.startTime, beginTime.value);
  const visibleEnd = Math.min(row.endTime, endTime.value);
  return Math.max(
    1.5,
    ((visibleEnd - visibleStart) / totalDuration.value) * 100,
  );
}

/** 打开工作项详情 */
function openWorkItem(item: PmsWorkItemApi.WorkItem) {
  workItemDetailDrawerApi.setData({ id: item.id! }).open();
}

defineExpose({ refresh: getGanttData });

/** 初始化 */
onMounted(() => {
  getGanttData();
});
</script>

<template>
  <!-- 项目甘特图 -->
  <div v-loading="loading">
    <!-- 筛选与时间轴设置 -->
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <ElInput
        v-model="keyword"
        class="!w-[240px]"
        clearable
        placeholder="搜索工作项"
        prefix-icon="ep:search"
      />
      <div class="flex flex-wrap items-center gap-3">
        <ElDatePicker
          v-model="dateRange"
          class="!w-[240px]"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="daterange"
        />
        <ElSelect v-model="viewMode" class="!w-[110px]">
          <ElOption
            v-for="option in viewModeOptions"
            :key="option.value"
            v-bind="option"
          />
        </ElSelect>
        <ElButton @click="resetRange">重置时间轴</ElButton>
      </div>
    </div>
    <ElEmpty
      v-if="datedRows.length === 0"
      description="暂无符合条件且已设置时间范围的工作项"
    />
    <!-- 甘特图时间轴 -->
    <div
      v-else
      class="max-h-[680px] min-w-[920px] overflow-auto border border-solid border-[var(--el-border-color-lighter)]"
      :style="{ '--timeline-width': `${timelineWidth}px` }"
    >
      <div
        class="sticky top-0 z-[4] grid min-h-[48px] grid-cols-[480px_var(--timeline-width)] border-0 border-b border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)]"
      >
        <div
          class="sticky left-0 z-[5] grid min-w-0 grid-cols-[280px_100px_100px] overflow-hidden border-0 border-r border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)]"
        >
          <span class="flex items-center px-3">名称</span>
          <span
            class="flex items-center border-0 border-l border-solid border-[var(--el-border-color-lighter)] px-2.5"
          >
            开始日期
          </span>
          <span
            class="flex items-center border-0 border-l border-solid border-[var(--el-border-color-lighter)] px-2.5"
          >
            结束日期
          </span>
        </div>
        <div
          class="relative flex items-center justify-between px-2.5 text-xs text-[var(--el-text-color-secondary)]"
        >
          <span
            v-for="tick in timelineTicks"
            :key="tick.time"
            class="absolute translate-x-[-1px] border-0 border-l border-solid border-[var(--el-border-color-lighter)] pl-1"
            :style="{ left: `${tick.left}%` }"
          >
            {{ tick.label }}
          </span>
        </div>
      </div>
      <div
        v-for="row in datedRows"
        :key="row.key"
        class="grid min-h-[48px] grid-cols-[480px_var(--timeline-width)] border-0 border-b border-solid border-[var(--el-border-color-lighter)]"
        :class="{ 'bg-[var(--el-fill-color-light)]': row.group }"
      >
        <div
          class="sticky left-0 z-[2] grid min-w-0 grid-cols-[280px_100px_100px] overflow-hidden border-0 border-r border-solid border-[var(--el-border-color-lighter)] bg-inherit"
        >
          <div
            class="flex min-w-0 items-center overflow-hidden"
            :style="{ paddingLeft: `${12 + row.depth * 18}px` }"
            :title="row.name"
          >
            <ElButton
              v-if="hasChildren(row.key)"
              class="mr-1"
              circle
              link
              size="small"
              @click="toggleRow(row.key)"
            >
              <IconifyIcon
                :icon="
                  collapsedKeys.has(row.key)
                    ? 'ep:arrow-right'
                    : 'ep:arrow-down'
                "
              />
            </ElButton>
            <IconifyIcon
              v-else-if="row.group"
              class="mr-1.5"
              icon="ep:calendar"
            />
            <ElButton
              v-if="row.item"
              link
              type="primary"
              @click="openWorkItem(row.item)"
            >
              #{{ row.item.serialNumber }} {{ row.name }}
            </ElButton>
            <span v-else class="truncate font-semibold">{{ row.name }}</span>
          </div>
          <span
            class="flex items-center border-0 border-l border-solid border-[var(--el-border-color-lighter)] px-2.5 text-xs"
          >
            {{ dayjs(row.startTime).format('YYYY-MM-DD') }}
          </span>
          <span
            class="flex items-center border-0 border-l border-solid border-[var(--el-border-color-lighter)] px-2.5 text-xs"
          >
            {{ dayjs(row.endTime).format('YYYY-MM-DD') }}
          </span>
        </div>
        <div
          class="relative flex items-center justify-between px-2.5 text-xs text-[var(--el-text-color-secondary)] [background-image:linear-gradient(to_right,var(--el-border-color-extra-light)_1px,transparent_1px)] [background-size:10%_100%]"
        >
          <div
            class="absolute z-[1] h-full w-px bg-[var(--el-color-danger)]"
            :style="{ left: `${todayPosition}%` }"
          ></div>
          <ElPopover placement="top" :width="260" trigger="hover">
            <template #reference>
              <div
                class="absolute flex h-6 min-w-[18px] items-center justify-center overflow-hidden rounded bg-[var(--el-color-primary)] text-white"
                :class="{
                  '!h-[18px] !bg-[var(--el-color-success)]': row.group,
                }"
                :style="{
                  left: `${getBarLeft(row)}%`,
                  width: `${getBarWidth(row)}%`,
                }"
              >
                <span>{{ row.group ? row.name : `${row.progress}%` }}</span>
              </div>
            </template>
            <div class="font-semibold">{{ row.name }}</div>
            <div class="mt-2 text-[13px]">
              {{ dayjs(row.startTime).format('YYYY-MM-DD') }} 至
              {{ dayjs(row.endTime).format('YYYY-MM-DD') }}
            </div>
            <template v-if="row.item">
              <div class="mt-1.5 text-[13px]">
                状态：{{ row.item.statusName }}
              </div>
              <div class="mt-1.5 text-[13px]">
                负责人：{{ row.item.assigneeUserName || '未分配' }}
              </div>
              <div class="mt-1.5 text-[13px]">进度：{{ row.progress }}%</div>
            </template>
          </ElPopover>
        </div>
      </div>
    </div>
  </div>
  <!-- 工作项详情 -->
  <WorkItemDetailDrawer @success="getGanttData" />
</template>
