<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { BarcodeBizTypeEnum } from '@vben/constants';

import { gantt } from 'dhtmlx-gantt';

import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

/**
 * 甘特图组件（基于 dhtmlx-gantt）
 *
 * 1. 按工单分组展示生产任务，工单为 project 行，任务为子行
 * 2. 支持只读预览和拖拽编辑两种模式
 * 3. 拖拽后触发 taskUpdate 事件，通知父组件批量保存
 * 4. 时间刻度：周 → 日 → 8 小时（1 工作日 = 8 小时）
 */
defineOptions({ name: 'GanttChart', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    height?: number; // 甘特图高度
    readonly?: boolean; // 是否只读
    tasks?: any[]; // 甘特图任务数据
  }>(),
  {
    height: 350,
    readonly: false,
    tasks: () => [],
  },
);

const emit = defineEmits<{
  taskClick: [id: number | string];
  taskUpdate: [task: any];
}>();

const ganttContainer = ref<HTMLElement>(); // 甘特图挂载容器
const ganttInited = ref(false); // 甘特图是否已初始化

/** 初始化甘特图配置 */
function initGantt() {
  if (!ganttContainer.value) {
    return;
  }
  gantt.i18n.setLocale('cn');

  gantt.config.readonly = props.readonly;
  gantt.config.date_format = '%Y-%m-%d %H:%i:%s';
  gantt.config.duration_unit = 'hour'; // 持续时间单位为小时，配合 duration_step 实现工作日单位
  gantt.config.duration_step = 8; // 1 工作日 = 8 小时
  gantt.config.row_height = 36;
  gantt.config.bar_height = 24;
  gantt.config.fit_tasks = true;
  gantt.config.auto_scheduling = false;
  gantt.config.drag_links = false;
  gantt.config.details_on_create = true;
  gantt.config.details_on_dblclick = true;
  gantt.config.show_progress = true;
  gantt.config.open_tree_initially = true;
  gantt.config.auto_types = false;
  gantt.config.drag_move = !props.readonly;
  gantt.config.drag_resize = !props.readonly;
  gantt.config.drag_progress = false;

  // lightbox 弹窗只保留时间编辑，去掉描述编辑和删除按钮
  gantt.config.lightbox.sections = [
    { name: 'time', type: 'duration', map_to: 'auto' },
  ];
  gantt.config.buttons_left = ['gantt_save_btn'];
  gantt.config.buttons_right = ['gantt_cancel_btn'];

  // 时间刻度：周 > 日 > 8 小时
  const weekScaleTemplate = (date: Date) => {
    const dateToStr = gantt.date.date_to_str('%M %d');
    const endDate = gantt.date.add(gantt.date.add(date, 1, 'week'), -1, 'day');
    return `${dateToStr(date)} - ${dateToStr(endDate)}`;
  };
  const dayTemplate = (date: Date) => gantt.date.date_to_str('%M %d')(date);
  const daysStyle = (date: Date) =>
    date.getDay() === 0 || date.getDay() === 6 ? 'weekend' : '';
  gantt.config.scales = [
    { unit: 'week', step: 1, format: weekScaleTemplate },
    { unit: 'day', step: 1, format: dayTemplate, css: daysStyle },
    { unit: 'hour', step: 8, format: '%H:%i' },
  ];
  gantt.config.scale_height = 50;
  gantt.config.show_task_cells = true;

  gantt.config.columns = [
    { name: 'text', label: '任务名称', tree: true, width: 180, resize: true },
    { name: 'workstation', label: '工作站', align: 'center', width: 100, resize: true },
    { name: 'process', label: '工序', align: 'center', width: 100, resize: true },
    { name: 'start_date', label: '开始时间', align: 'center', width: 130 },
    { name: 'end_date', label: '结束时间', align: 'center', width: 130 },
  ];

  gantt.plugins({ marker: true, tooltip: true });
  gantt.addMarker({ start_date: new Date(), css: 'today', text: '今天' });

  gantt.templates.task_text = (_start: any, _end: any, task: any) => {
    const percent = Math.round((task.progress || 0) * 100);
    if (task.type === 'project') {
      return `<b>生产工单:</b> ${task.text} <span>完成比例：${percent}%</span>`;
    }
    return `<b>生产任务:</b> ${task.process || ''} ${task.text} <span>完成比例：${percent}%</span>`;
  };

  gantt.templates.tooltip_text = (_start: any, _end: any, task: any) => {
    const percent = Math.round((task.progress || 0) * 100);
    if (task.type === 'project') {
      return `<b>生产工单:</b> ${task.text} <span>完成比例：${percent}%</span>`;
    }
    return `<b>生产任务:</b> ${task.process || ''} ${task.text} <span>完成比例：${percent}%</span>`;
  };

  gantt.templates.task_class = (_start: any, _end: any, task: any) =>
    task.type === gantt.config.types.project ? 'gantt-project-bar' : '';
  gantt.templates.timeline_cell_class = () => '';
  gantt.templates.task_row_class = () => '';

  // 编辑事件监听（通过 lightbox 弹窗编辑后触发）
  if (!props.readonly) {
    gantt.attachEvent('onAfterTaskUpdate', (id: number | string) => {
      const task = gantt.getTask(id);
      // 只回写 task 节点，避免把工单(project)节点当成任务保存
      if (task.type !== gantt.config.types.task || !task.originalId) {
        return;
      }
      emit('taskUpdate', {
        duration: task.duration,
        endTime: task.end_date,
        id: task.originalId,
        startTime: task.start_date,
      });
    });
  }

  gantt.attachEvent('onTaskClick', (id: number | string) => {
    emit('taskClick', id);
    return true;
  });

  gantt.init(ganttContainer.value);
  ganttInited.value = true;
}

/** 加载数据到甘特图 */
function loadData(tasks: any[]) {
  if (!ganttInited.value) {
    return;
  }
  gantt.clearAll();
  // 后端 type 使用整数业务类型，需映射为 gantt 类型字符串
  const typeMap: Record<number, string> = {
    [BarcodeBizTypeEnum.WORKORDER]: 'project',
    [BarcodeBizTypeEnum.TASK]: 'task',
  };
  gantt.parse({
    data: tasks.map((item: any) => ({
      ...item,
      type: typeMap[item.type] || item.type,
      start_date: item.startDate ? new Date(item.startDate) : undefined,
      end_date: item.endDate ? new Date(item.endDate) : undefined,
    })),
    links: [],
  });
}

watch(
  () => props.tasks,
  (val) => {
    if (val?.length && ganttInited.value) {
      loadData(val);
    }
  },
  { deep: true },
);

onMounted(() => {
  initGantt();
  if (props.tasks?.length) {
    loadData(props.tasks);
  }
});

onBeforeUnmount(() => {
  if (ganttInited.value) {
    gantt.clearAll();
  }
});

defineExpose({ loadData });
</script>

<template>
  <div ref="ganttContainer" :style="{ width: '100%', height: `${height}px` }"></div>
</template>

<style>
/* 今天标记线 */
.gantt_marker.today {
  background-color: #f44;
  opacity: 0.4;
}

.gantt_marker.today .gantt_marker_content {
  font-size: 12px;
  color: #f44;
}

/* 工单（project）行样式 */
.gantt-project-bar .gantt_task_progress {
  background: #7b68ee;
}

/* 甘特条圆角 */
.gantt_task_line {
  border-radius: 8px;
}

/* 周末背景色 */
.weekend {
  background: #f0f0f0 !important;
}

/* 行悬浮高亮 */
.gantt_grid_data .gantt_row:hover,
.gantt_grid_data .gantt_row.odd:hover {
  background-color: #f3f1fe !important;
}

/* 选中行高亮 */
.gantt_grid_data .gantt_row.gantt_selected,
.gantt_grid_data .gantt_row.odd.gantt_selected,
.gantt_task_row.gantt_selected {
  background-color: #f3f1fe !important;
}
</style>
