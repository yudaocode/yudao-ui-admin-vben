<script lang="ts" setup>
import { inject, nextTick, ref, toRaw, watch } from 'vue';

import {
  ElCol,
  ElDivider,
  ElFormItem,
  ElInputNumber,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElRow,
  ElSelect,
  ElSwitch,
  ElText,
} from 'element-plus';

import { convertTimeUnit } from '#/views/bpm/components/simple-process-design/components/nodes-config/utils';
import {
  TIME_UNIT_TYPES,
  TIMEOUT_HANDLER_TYPES,
  TimeUnitType,
} from '#/views/bpm/components/simple-process-design/consts';

defineOptions({ name: 'ElementCustomConfig4BoundaryEventTimer' });
const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: '',
  },
});
const prefix = inject('prefix');

const bpmnElement = ref<any>();
const bpmnInstances = () => (window as Record<string, any>)?.bpmnInstances;

const timeoutHandlerEnable = ref(false);
const boundaryEventType = ref<any>();
const timeoutHandlerType = ref<{
  value: number | undefined;
}>({
  value: undefined,
});
const timeModdle = ref<any>();
const timeDuration = ref(6);
const timeUnit = ref(TimeUnitType.HOUR);
const maxRemindCount = ref(1);

const elExtensionElements = ref<any>();
const otherExtensions = ref<any[]>();
const configExtensions = ref<any[]>([]);
const eventDefinition = ref<any>();

const resetElement = () => {
  bpmnElement.value = bpmnInstances().bpmnElement;
  eventDefinition.value = bpmnElement.value.businessObject.eventDefinitions[0];

  // 获取元素扩展属性 或者 创建扩展属性
  elExtensionElements.value =
    bpmnElement.value.businessObject?.extensionElements ??
    bpmnInstances().moddle.create('bpmn:ExtensionElements', { values: [] });

  // 是否开启自定义用户任务超时处理
  boundaryEventType.value = elExtensionElements.value.values?.find(
    (ex: any) => ex.$type === `${prefix}:BoundaryEventType`,
  );
  if (boundaryEventType.value && boundaryEventType.value.value === 1) {
    timeoutHandlerEnable.value = true;
    configExtensions.value.push(boundaryEventType.value);
  }

  // 执行动作
  timeoutHandlerType.value = elExtensionElements.value.values?.find(
    (ex: any) => ex.$type === `${prefix}:TimeoutHandlerType`,
  );
  if (timeoutHandlerType.value) {
    configExtensions.value.push(timeoutHandlerType.value);
    if (eventDefinition.value.timeCycle) {
      const timeStr = eventDefinition.value.timeCycle.body;
      const maxRemindCountStr = timeStr.split('/')[0];
      const timeDurationStr = timeStr.split('/')[1];
      maxRemindCount.value = Number.parseInt(maxRemindCountStr.slice(1));
      timeDuration.value = Number.parseInt(timeDurationStr.slice(2, -1));
      timeUnit.value = convertTimeUnit(timeDurationStr.slice(-1));
      timeModdle.value = eventDefinition.value.timeCycle;
    }
    if (eventDefinition.value.timeDuration) {
      const timeDurationStr = eventDefinition.value.timeDuration.body;
      timeDuration.value = Number.parseInt(timeDurationStr.slice(2, -1));
      timeUnit.value = convertTimeUnit(timeDurationStr.slice(-1));
      timeModdle.value = eventDefinition.value.timeDuration;
    }
  }

  // 保留剩余扩展元素，便于后面更新该元素对应属性
  otherExtensions.value =
    elExtensionElements.value.values?.filter(
      (ex: any) =>
        ex.$type !== `${prefix}:BoundaryEventType` &&
        ex.$type !== `${prefix}:TimeoutHandlerType`,
    ) ?? [];
};

const timeoutHandlerChange = (checked: any) => {
  timeoutHandlerEnable.value = checked;
  if (checked) {
    // 启用自定义用户任务超时处理
    // 边界事件类型 --- 超时
    boundaryEventType.value = bpmnInstances().moddle.create(
      `${prefix}:BoundaryEventType`,
      {
        value: 1,
      },
    );
    configExtensions.value.push(boundaryEventType.value);
    // 超时处理类型
    timeoutHandlerType.value = bpmnInstances().moddle.create(
      `${prefix}:TimeoutHandlerType`,
      {
        value: 1,
      },
    );
    configExtensions.value.push(timeoutHandlerType.value);
    // 超时时间表达式
    timeDuration.value = 6;
    timeUnit.value = 2;
    maxRemindCount.value = 1;
    timeModdle.value = bpmnInstances().moddle.create(`bpmn:Expression`, {
      body: 'PT6H',
    });
    eventDefinition.value.timeDuration = timeModdle.value;
  } else {
    // 关闭自定义用户任务超时处理
    configExtensions.value = [];
    delete eventDefinition.value.timeDuration;
    delete eventDefinition.value.timeCycle;
  }
  updateElementExtensions();
};

const onTimeoutHandlerTypeChanged = () => {
  maxRemindCount.value = 1;
  updateElementExtensions();
  updateTimeModdle();
};

const onTimeUnitChange = () => {
  // 分钟，默认是 60 分钟
  if (timeUnit.value === TimeUnitType.MINUTE) {
    timeDuration.value = 60;
  }
  // 小时，默认是 6 个小时
  if (timeUnit.value === TimeUnitType.HOUR) {
    timeDuration.value = 6;
  }
  // 天， 默认 1天
  if (timeUnit.value === TimeUnitType.DAY) {
    timeDuration.value = 1;
  }
  updateTimeModdle();
  updateElementExtensions();
};

const updateTimeModdle = () => {
  if (maxRemindCount.value > 1) {
    timeModdle.value.body = `R${maxRemindCount.value}/${isoTimeDuration()}`;
    if (!eventDefinition.value.timeCycle) {
      delete eventDefinition.value.timeDuration;
      eventDefinition.value.timeCycle = timeModdle.value;
    }
  } else {
    timeModdle.value.body = isoTimeDuration();
    if (!eventDefinition.value.timeDuration) {
      delete eventDefinition.value.timeCycle;
      eventDefinition.value.timeDuration = timeModdle.value;
    }
  }
};

const isoTimeDuration = () => {
  let strTimeDuration = 'PT';
  if (timeUnit.value === TimeUnitType.MINUTE) {
    strTimeDuration += `${timeDuration.value}M`;
  }
  if (timeUnit.value === TimeUnitType.HOUR) {
    strTimeDuration += `${timeDuration.value}H`;
  }
  if (timeUnit.value === TimeUnitType.DAY) {
    strTimeDuration += `${timeDuration.value}D`;
  }
  return strTimeDuration;
};

const updateElementExtensions = () => {
  const extensions = bpmnInstances().moddle.create('bpmn:ExtensionElements', {
    values: [...(otherExtensions.value || []), ...configExtensions.value],
  });
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    extensionElements: extensions,
  });
};

watch(
  () => props.id,
  (val) => {
    val &&
      val.length > 0 &&
      nextTick(() => {
        resetElement();
      });
  },
  { immediate: true },
);
</script>

<template>
  <div>
    <ElDivider content-position="left">审批人超时未处理时</ElDivider>
    <ElFormItem label="启用开关" prop="timeoutHandlerEnable">
      <ElSwitch
        v-model="timeoutHandlerEnable"
        active-text="开启"
        inactive-text="关闭"
        @change="timeoutHandlerChange"
      />
    </ElFormItem>
    <ElFormItem
      label="执行动作"
      prop="timeoutHandlerType"
      v-if="timeoutHandlerEnable"
    >
      <ElRadioGroup
        v-model="timeoutHandlerType.value"
        @change="onTimeoutHandlerTypeChanged"
      >
        <ElRadioButton
          v-for="item in TIMEOUT_HANDLER_TYPES"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </ElRadioButton>
      </ElRadioGroup>
    </ElFormItem>
    <ElFormItem label="超时时间设置" v-if="timeoutHandlerEnable">
      <ElRow :gutter="0">
        <ElCol :span="6">
          <ElText class="mr-2 mt-2 inline-flex text-sm"> 当超过 </ElText>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem prop="timeDuration" class="mb-0">
            <ElInputNumber
              class="mr-2 mt-0.5"
              v-model="timeDuration"
              :min="1"
              controls-position="right"
              @change="
                () => {
                  updateTimeModdle();
                  updateElementExtensions();
                }
              "
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElSelect
            v-model="timeUnit"
            class="mr-2 !w-24"
            @change="onTimeUnitChange"
          >
            <ElOption
              v-for="item in TIME_UNIT_TYPES"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
          <ElText class="mr-2 mt-2 inline-flex text-sm"> 未处理 </ElText>
        </ElCol>
      </ElRow>
    </ElFormItem>
    <ElFormItem
      label="最大提醒次数"
      prop="maxRemindCount"
      v-if="timeoutHandlerEnable && timeoutHandlerType.value === 1"
    >
      <ElInputNumber
        v-model="maxRemindCount"
        :min="1"
        :max="10"
        @change="
          () => {
            updateTimeModdle();
            updateElementExtensions();
          }
        "
      />
    </ElFormItem>
  </div>
</template>
