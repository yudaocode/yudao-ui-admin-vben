<script lang="ts" setup>
import type { Ref } from 'vue';

import { computed, nextTick, onMounted, ref, toRaw, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElButtonGroup,
  ElDatePicker,
  ElInput,
  ElTooltip,
} from 'element-plus';

import CycleConfig from './CycleConfig.vue';
import DurationConfig from './DurationConfig.vue';

const props = defineProps({
  businessObject: {
    type: Object,
    default: () => ({}),
  },
});

const bpmnInstances = () => (window as any).bpmnInstances;
const type: Ref<string> = ref('time');
const condition: Ref<string> = ref('');
const valid: Ref<boolean> = ref(false);
// TODO @jason：const dateValue = ref<Dayjs>(); 需要么？
const dateValue = ref();

const placeholder = computed<string>(() => {
  if (type.value === 'time') return '请输入时间';
  if (type.value === 'duration') return '请输入持续时长';
  if (type.value === 'cycle') return '请输入循环表达式';
  return '';
});
const helpText = computed<string>(() => {
  if (type.value === 'time') return '选择具体时间';
  if (type.value === 'duration') return 'ISO 8601格式，如PT1H';
  if (type.value === 'cycle') return 'CRON表达式或ISO 8601周期';
  return '';
});
const helpHtml = computed<string>(() => {
  if (type.value === 'duration') {
    return `指定定时器之前要等待多长时间。S表示秒，M表示分，D表示天；P表示时间段，T表示精确到时间的时间段。<br>
    时间格式依然为ISO 8601格式，一年两个月三天四小时五分六秒内，可以写成P1Y2M3DT4H5M6S。<br>
    P是开始标记，T是时间和日期分割标记，没有日期只有时间T是不能省去的，比如1小时执行一次应写成PT1H。`;
  }
  if (type.value === 'cycle') {
    return `支持CRON表达式（如0 0/30 * * * ?）或ISO 8601周期（如R3/PT10M）。`;
  }
  if (type.value === 'time') {
    return `支持ISO 8601格式的时间（如2024-12-12T12:12:12）`;
  }
  return '';
});

// 初始化和监听
function syncFromBusinessObject(): void {
  if (props.businessObject) {
    const timerDef = (props.businessObject.eventDefinitions || [])[0];
    if (timerDef) {
      if (timerDef.timeDate) {
        type.value = 'time';
        condition.value = timerDef.timeDate.body;
      } else if (timerDef.timeDuration) {
        type.value = 'duration';
        condition.value = timerDef.timeDuration.body;
      } else if (timerDef.timeCycle) {
        type.value = 'cycle';
        condition.value = timerDef.timeCycle.body;
      }
    }
  }
}
onMounted(syncFromBusinessObject);

// 切换类型
function setType(t: string) {
  type.value = t;
  condition.value = '';
  updateNode();
}

// 输入校验
watch([type, condition], () => {
  valid.value = validate();
});

function validate(): boolean {
  if (type.value === 'time') {
    return !!condition.value && !Number.isNaN(Date.parse(condition.value));
  }
  if (type.value === 'duration') {
    return /^P.*$/.test(condition.value);
  }
  if (type.value === 'cycle') {
    // 支持CRON表达式或ISO 8601周期格式：R{n}/P... 或 R{n}/{date}/P...
    return /^(?:[0-9*/?, ]+|R\d+(?:\/[^/]+)*\/P.*)$/.test(condition.value);
  }
  return true;
}

// 选择时间 Modal
const [DateModal, dateModalApi] = useVbenModal({
  title: '选择时间',
  // TODO @jason：antd 这里有个属性，需要么？
  onConfirm: onDateConfirm,
});

function onDateChange(val: any) {
  dateValue.value = val || undefined;
}
function onDateConfirm(): void {
  if (dateValue.value) {
    condition.value = dateValue.value.toISOString();
    dateModalApi.close();
    updateNode();
  }
}

// 持续时长 Modal
const [DurationModal, durationModalApi] = useVbenModal({
  title: '时间配置',
  // TODO @jason：antd 这里有个属性，需要么？
  onConfirm: onDurationConfirm,
});

function onDurationChange(val: string) {
  condition.value = val;
}
function onDurationConfirm(): void {
  durationModalApi.close();
  updateNode();
}

// 循环配置 Modal
const [CycleModal, cycleModalApi] = useVbenModal({
  title: '时间配置',
  // TODO @jason：antd 这里有个属性，需要么？
  onConfirm: onCycleConfirm,
});

function onCycleChange(val: string) {
  condition.value = val;
}
function onCycleConfirm(): void {
  cycleModalApi.close();
  updateNode();
}

// 帮助说明 Modal
const [HelpModal, helpModalApi] = useVbenModal({
  class: 'w-[600px]',
  title: '格式说明',
  showCancelButton: false,
  confirmText: '关闭',
  onConfirm: () => helpModalApi.close(),
});

// 点击输入框时弹窗
function handleInputClick(): void {
  if (type.value === 'time') dateModalApi.open();
  if (type.value === 'duration') durationModalApi.open();
  if (type.value === 'cycle') cycleModalApi.open();
}

// 同步到节点
function updateNode(): void {
  const moddle = (window.bpmnInstances as any)?.moddle;
  const modeling = (window.bpmnInstances as any)?.modeling;
  const elementRegistry = (window.bpmnInstances as any)?.elementRegistry;
  if (!moddle || !modeling || !elementRegistry) return;

  // 获取元素
  if (!props.businessObject || !props.businessObject.id) return;
  const element = elementRegistry.get(props.businessObject.id);
  if (!element) return;

  // 1. 复用原有 timerDef，或新建
  let timerDef =
    element.businessObject.eventDefinitions &&
    element.businessObject.eventDefinitions[0];
  if (!timerDef) {
    timerDef = bpmnInstances().bpmnFactory.create(
      'bpmn:TimerEventDefinition',
      {},
    );
    modeling.updateProperties(element, {
      eventDefinitions: [timerDef],
    });
  }

  // 2. 清空原有
  delete timerDef.timeDate;
  delete timerDef.timeDuration;
  delete timerDef.timeCycle;

  // 3. 设置新的
  if (type.value === 'time' && condition.value) {
    timerDef.timeDate = bpmnInstances().bpmnFactory.create(
      'bpmn:FormalExpression',
      {
        body: condition.value,
      },
    );
  } else if (type.value === 'duration' && condition.value) {
    timerDef.timeDuration = bpmnInstances().bpmnFactory.create(
      'bpmn:FormalExpression',
      {
        body: condition.value,
      },
    );
  } else if (type.value === 'cycle' && condition.value) {
    timerDef.timeCycle = bpmnInstances().bpmnFactory.create(
      'bpmn:FormalExpression',
      {
        body: condition.value,
      },
    );
  }

  bpmnInstances().modeling.updateProperties(toRaw(element), {
    eventDefinitions: [timerDef],
  });
}

watch(
  () => props.businessObject,
  (val) => {
    if (val) {
      nextTick(() => {
        syncFromBusinessObject();
      });
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="panel-tab__content">
    <div class="mt-2 flex items-center">
      <span class="w-14">类型：</span>
      <ElButtonGroup>
        <ElButton
          size="small"
          :type="type === 'time' ? 'primary' : 'default'"
          @click="setType('time')"
        >
          时间
        </ElButton>
        <ElButton
          size="small"
          :type="type === 'duration' ? 'primary' : 'default'"
          @click="setType('duration')"
        >
          持续
        </ElButton>
        <ElButton
          size="small"
          :type="type === 'cycle' ? 'primary' : 'default'"
          @click="setType('cycle')"
        >
          循环
        </ElButton>
      </ElButtonGroup>
      <IconifyIcon
        icon="ant-design:check-circle-filled"
        v-if="valid"
        class="ml-2 text-green-500"
      />
    </div>
    <div class="mt-2 flex items-center gap-1">
      <span class="w-14">条件：</span>
      <ElInput
        v-model="condition"
        :placeholder="placeholder"
        class="w-full"
        :readonly="type !== 'duration' && type !== 'cycle'"
        @click="handleInputClick"
        @blur="updateNode"
      >
        <template #suffix>
          <div class="flex items-center gap-1">
            <ElTooltip v-if="!valid" content="格式错误" placement="top">
              <IconifyIcon
                icon="ant-design:exclamation-circle-filled"
                class="text-orange-400"
              />
            </ElTooltip>
            <ElTooltip :content="helpText" placement="top">
              <IconifyIcon
                icon="ant-design:question-circle-filled"
                class="cursor-pointer text-[#409eff]"
                @click="helpModalApi.open()"
              />
            </ElTooltip>
            <ElButton
              v-if="type === 'time'"
              @click="dateModalApi.open()"
              class="ml-1 flex items-center justify-center"
              circle
              size="small"
            >
              <IconifyIcon icon="ep:calendar" />
            </ElButton>
            <ElButton
              v-if="type === 'duration'"
              @click="durationModalApi.open()"
              class="ml-1 flex items-center justify-center"
              circle
              size="small"
            >
              <IconifyIcon icon="ep:timer" />
            </ElButton>
            <ElButton
              v-if="type === 'cycle'"
              @click="cycleModalApi.open()"
              class="ml-1 flex items-center justify-center"
              circle
              size="small"
            >
              <IconifyIcon icon="ep:setting" />
            </ElButton>
          </div>
        </template>
      </ElInput>
    </div>

    <!-- 时间选择器 -->
    <DateModal>
      <ElDatePicker
        v-model="dateValue"
        type="datetime"
        placeholder="选择日期时间"
        class="!w-full"
        @change="onDateChange"
      />
    </DateModal>

    <!-- 持续时长选择器 -->
    <DurationModal>
      <DurationConfig :value="condition" @change="onDurationChange" />
    </DurationModal>

    <!-- 循环配置器 -->
    <CycleModal class="w-2/3">
      <CycleConfig :value="condition" @change="onCycleChange" />
    </CycleModal>

    <!-- 帮助说明 -->
    <HelpModal>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-html="helpHtml"></div>
    </HelpModal>
  </div>
</template>
