<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue';

import { Icon } from '@vben/icons';

import { Collapse, CollapsePanel } from 'ant-design-vue';

import ElementBaseInfo from './base/ElementBaseInfo.vue';
import FlowCondition from './flow-condition/FlowCondition.vue';
import ElementListeners from './listeners/ElementListeners.vue';
// import ElementForm from './form/ElementForm.vue'
import UserTaskListeners from './listeners/UserTaskListeners.vue';
import ElementMultiInstance from './multi-instance/ElementMultiInstance.vue';
import ElementOtherConfig from './other/ElementOtherConfig.vue';
import ElementProperties from './properties/ElementProperties.vue';
import SignalAndMassage from './signal-message/SignalAndMessage.vue';
import { getTaskCollapseItemName, isTaskCollapseItemShow } from './task/data';
import ElementTask from './task/ElementTask.vue';
import TimeEventConfig from './time-event-config/TimeEventConfig.vue';

defineOptions({ name: 'MyPropertiesPanel' });

/**
 * 侧边栏
 * @Author MiyueFE
 * @Home https://github.com/miyuesc
 * @Date 2021年3月31日18:57:51
 */
const props = defineProps({
  bpmnModeler: {
    type: Object,
    default: () => {},
  },
  prefix: {
    type: String,
    default: 'camunda',
  },
  width: {
    type: Number,
    default: 480,
  },
  idEditDisabled: {
    type: Boolean,
    default: false,
  },
  model: Object, // 流程模型的数据
});

const activeTab = ref('base');
const elementId = ref('');
const elementType = ref('');
const elementBusinessObject = ref<any>({}); // 元素 businessObject 镜像，提供给需要做判断的组件使用
const conditionFormVisible = ref(false); // 流转条件设置
const formVisible = ref(false); // 表单配置
const bpmnElement = ref();
const isReady = ref(false);

const type = ref('time');
const condition = ref('');
provide('prefix', props.prefix);
provide('width', props.width);

// 初始化 bpmnInstances
const initBpmnInstances = () => {
  if (!props.bpmnModeler) return false;
  try {
    const instances = {
      modeler: props.bpmnModeler,
      modeling: props.bpmnModeler.get('modeling'),
      moddle: props.bpmnModeler.get('moddle'),
      eventBus: props.bpmnModeler.get('eventBus'),
      bpmnFactory: props.bpmnModeler.get('bpmnFactory'),
      elementFactory: props.bpmnModeler.get('elementFactory'),
      elementRegistry: props.bpmnModeler.get('elementRegistry'),
      replace: props.bpmnModeler.get('replace'),
      selection: props.bpmnModeler.get('selection'),
    };

    // 检查所有实例是否都存在
    const allInstancesExist = Object.values(instances).every(
      Boolean,
    );
    if (allInstancesExist) {
      const w = window as any;
      w.bpmnInstances = instances;
      return true;
    }
    return false;
  } catch (error) {
    console.error('初始化 bpmnInstances 失败:', error);
    return false;
  }
};

const bpmnInstances = () => (window as any)?.bpmnInstances;

// 监听 props.bpmnModeler 然后 initModels
const unwatchBpmn = watch(
  () => props.bpmnModeler,
  async () => {
    // 避免加载时 流程图 并未加载完成
    if (!props.bpmnModeler) {
      console.log('缺少props.bpmnModeler');
      return;
    }

    try {
      // 等待 modeler 初始化完成
      await nextTick();
      if (initBpmnInstances()) {
        isReady.value = true;
        await nextTick();
        getActiveElement();
      } else {
        console.error('modeler 实例未完全初始化');
      }
    } catch (error) {
      console.error('初始化失败:', error);
    }
  },
  {
    immediate: true,
  },
);

const getActiveElement = () => {
  if (!isReady.value || !props.bpmnModeler) return;

  // 初始第一个选中元素 bpmn:Process
  initFormOnChanged(null);
  props.bpmnModeler.on('import.done', (e) => {
    console.log(e, 'eeeee');
    initFormOnChanged(null);
  });
  // 监听选择事件，修改当前激活的元素以及表单
  props.bpmnModeler.on('selection.changed', ({ newSelection }) => {
    initFormOnChanged(newSelection[0] || null);
  });
  props.bpmnModeler.on('element.changed', ({ element }) => {
    // 保证 修改 "默认流转路径" 类似需要修改多个元素的事件发生的时候，更新表单的元素与原选中元素不一致。
    if (element && element.id === elementId.value) {
      initFormOnChanged(element);
    }
  });
};

// 初始化数据
const initFormOnChanged = (element) => {
  if (!isReady.value || !bpmnInstances()) return;

  let activatedElement = element;
  if (!activatedElement) {
    activatedElement =
      bpmnInstances().elementRegistry.find(
        (el) => el.type === 'bpmn:Process',
      ) ??
      bpmnInstances().elementRegistry.find(
        (el) => el.type === 'bpmn:Collaboration',
      );
  }
  if (!activatedElement) return;

  try {
    console.log(`
                ----------
        select element changed:
                  id:  ${activatedElement.id}
                type:  ${activatedElement.businessObject.$type}
                ----------
                `);
    console.log('businessObject:', activatedElement.businessObject);
    bpmnInstances().bpmnElement = activatedElement;
    bpmnElement.value = activatedElement;
    elementId.value = activatedElement.id;
    elementType.value = activatedElement.type.split(':')[1] || '';
    elementBusinessObject.value = JSON.parse(
      JSON.stringify(activatedElement.businessObject),
    );
    conditionFormVisible.value = !!(
      elementType.value === 'SequenceFlow' &&
      activatedElement.source &&
      !activatedElement.source.type.indexOf('StartEvent') === -1
    );
    formVisible.value =
      elementType.value === 'UserTask' || elementType.value === 'StartEvent';
  } catch (error) {
    console.error('初始化表单数据失败:', error);
  }
};

onBeforeUnmount(() => {
  const w = window as any;
  w.bpmnInstances = null;
  isReady.value = false;
});

watch(
  () => elementId.value,
  () => {
    activeTab.value = 'base';
  },
);

function updateNode() {
  const moddle = window.bpmnInstances?.moddle;
  const modeling = window.bpmnInstances?.modeling;
  const elementRegistry = window.bpmnInstances?.elementRegistry;
  if (!moddle || !modeling || !elementRegistry) return;

  const element = elementRegistry.get(props.businessObject.id);
  if (!element) return;

  const timerDef = moddle.create('bpmn:TimerEventDefinition', {});
  switch (type.value) {
  case 'cycle': {
    timerDef.timeCycle = moddle.create('bpmn:FormalExpression', {
      body: condition.value,
    });

  break;
  }
  case 'duration': {
    timerDef.timeDuration = moddle.create('bpmn:FormalExpression', {
      body: condition.value,
    });

  break;
  }
  case 'time': {
    timerDef.timeDate = moddle.create('bpmn:FormalExpression', {
      body: condition.value,
    });

  break;
  }
  // No default
  }

  modeling.updateModdleProperties(element, element.businessObject, {
    eventDefinitions: [timerDef],
  });
}

// 初始化和监听
function syncFromBusinessObject() {
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
watch(() => props.businessObject, syncFromBusinessObject, { deep: true });
</script>
<template>
  <div
    class="process-panel__container"
    :style="{ width: `${width}px`, maxHeight: '600px' }"
  >
    <Collapse v-model:active-key="activeTab" v-if="isReady">
      <CollapsePanel key="base" header="常规">
        <template #title>
          <Icon icon="ant-design:info-circle-filled" />
          常规
        </template>
        <ElementBaseInfo
          :id-edit-disabled="idEditDisabled"
          :business-object="elementBusinessObject"
          :type="elementType"
          :model="model"
        />
      </CollapsePanel>
      <CollapsePanel
        key="message"
        v-if="elementType === 'Process'"
      >
        <template #title>
          <Icon icon="ant-design:message-filled" />
          消息与信号
        </template>
        <SignalAndMassage />
      </CollapsePanel>
      <CollapsePanel
        key="condition"
        v-if="conditionFormVisible"
      >
        <template #title>
          <Icon icon="ant-design:swap-right" />
          流转条件
        </template>
        <FlowCondition
          :business-object="elementBusinessObject"
          :type="elementType"
        />
      </CollapsePanel>
      <CollapsePanel key="form" v-if="formVisible">
        <template #title>
          <Icon icon="ant-design:unordered-list-outlined" />
          表单
        </template>
        <element-form :id="elementId" :type="elementType" />
      </CollapsePanel>
      <CollapsePanel
        key="task"
        v-if="isTaskCollapseItemShow(elementType)"
      >
        <template #title>
          <Icon icon="ant-design:check-circle-filled" />
          {{ getTaskCollapseItemName(elementType) }}
        </template>
        <ElementTask :id="elementId" :type="elementType" />
      </CollapsePanel>
      <CollapsePanel
        key="multiInstance"
        v-if="elementType.includes('Task')"
      >
        <template #title>
          <Icon icon="ant-design:question-circle-filled" />
          多人审批方式
        </template>
        <ElementMultiInstance
          :id="elementId"
          :business-object="elementBusinessObject"
          :type="elementType"
        />
      </CollapsePanel>
      <CollapsePanel key="listeners">
        <template #title>
          <Icon icon="ant-design:bell-filled" />
          执行监听器
        </template>
        <ElementListeners :id="elementId" :type="elementType" />
      </CollapsePanel>
      <CollapsePanel
        key="taskListeners"
        v-if="elementType === 'UserTask'"
      >
        <template #title>
          <Icon icon="ant-design:bell-filled" />
          任务监听器
        </template>
        <UserTaskListeners :id="elementId" :type="elementType" />
      </CollapsePanel>
      <CollapsePanel key="extensions">
        <template #title>
          <Icon icon="ant-design:plus-circle-filled" />
          扩展属性
        </template>
        <ElementProperties :id="elementId" :type="elementType" />
      </CollapsePanel>
      <CollapsePanel key="other">
        <template #title>
          <Icon icon="ant-design:swap-right" />
          其他
        </template>
        <ElementOtherConfig :id="elementId" />
      </CollapsePanel>
      <CollapsePanel key="customConfig">
        <template #title>
          <Icon icon="ant-design:tool-filled" />
          自定义配置
        </template>
        <element-custom-config
          :id="elementId"
          :type="elementType"
          :business-object="elementBusinessObject"
        />
      </CollapsePanel>
      <!-- 新增的时间事件配置项 -->
      <CollapsePanel
        key="timeEvent"
        v-if="elementType === 'IntermediateCatchEvent'"
      >
        <template #title>
          <Icon icon="ant-design:clock-circle-filled" />
          时间事件
        </template>
        <TimeEventConfig
          :business-object="bpmnElement.value?.businessObject"
          :key="elementId"
        />
      </CollapsePanel>
    </Collapse>
  </div>
</template>.includes('StartEvent')
    );
    formVisible.value =
      elementType.value === 'UserTask' || elementType.value === 'StartEvent';
  } catch (error) {
    console.error('初始化表单数据失败:', error);
  }
};

onBeforeUnmount(() => {
  const w = window as any;
  w.bpmnInstances = null;
  isReady.value = false;
});

watch(
  () => elementId.value,
  () => {
    activeTab.value = 'base';
  },
);

function updateNode() {
  const moddle = window.bpmnInstances?.moddle;
  const modeling = window.bpmnInstances?.modeling;
  const elementRegistry = window.bpmnInstances?.elementRegistry;
  if (!moddle || !modeling || !elementRegistry) return;

  const element = elementRegistry.get(props.businessObject.id);
  if (!element) return;

  const timerDef = moddle.create('bpmn:TimerEventDefinition', {});
  switch (type.value) {
  case 'time': {
    timerDef.timeDate = moddle.create('bpmn:FormalExpression', {
      body: condition.value,
    });

  break;
  }
  case 'duration': {
    timerDef.timeDuration = moddle.create('bpmn:FormalExpression', {
      body: condition.value,
    });

  break;
  }
  case 'cycle': {
    timerDef.timeCycle = moddle.create('bpmn:FormalExpression', {
      body: condition.value,
    });

  break;
  }
  // No default
  }

  modeling.updateModdleProperties(element, element.businessObject, {
    eventDefinitions: [timerDef],
  });
}

// 初始化和监听
function syncFromBusinessObject() {
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
watch(() => props.businessObject, syncFromBusinessObject, { deep: true });
</script>
<template>
  <div
    class="process-panel__container"
    :style="{ width: `${width}px`, maxHeight: '600px' }"
  >
    <Collapse v-model:active-key="activeTab" v-if="isReady">
      <CollapsePanel key="base" header="常规">
        <template #title>
          <Icon icon="ant-design:info-circle-filled" />
          常规
        </template>
        <ElementBaseInfo
          :id-edit-disabled="idEditDisabled"
          :business-object="elementBusinessObject"
          :type="elementType"
          :model="model"
        />
      </CollapsePanel>
      <CollapsePanel key="message" v-if="elementType === 'Process'">
        <template #title>
          <Icon icon="ant-design:message-filled" />
          消息与信号
        </template>
        <SignalAndMassage />
      </CollapsePanel>
      <CollapsePanel key="condition" v-if="conditionFormVisible">
        <template #title>
          <Icon icon="ant-design:swap-right" />
          流转条件
        </template>
        <FlowCondition
          :business-object="elementBusinessObject"
          :type="elementType"
        />
      </CollapsePanel>
      <CollapsePanel key="form" v-if="formVisible">
        <template #title>
          <Icon icon="ant-design:unordered-list-outlined" />
          表单
        </template>
        <element-form :id="elementId" :type="elementType" />
      </CollapsePanel>
      <CollapsePanel key="task" v-if="isTaskCollapseItemShow(elementType)">
        <template #title>
          <Icon icon="ant-design:check-circle-filled" />
          {{ getTaskCollapseItemName(elementType) }}
        </template>
        <ElementTask :id="elementId" :type="elementType" />
      </CollapsePanel>
      <CollapsePanel
        key="multiInstance"
        v-if="elementType.includes('Task')"
      >
        <template #title>
          <Icon icon="ant-design:question-circle-filled" />
          多人审批方式
        </template>
        <ElementMultiInstance
          :id="elementId"
          :business-object="elementBusinessObject"
          :type="elementType"
        />
      </CollapsePanel>
      <CollapsePanel key="listeners">
        <template #title>
          <Icon icon="ant-design:bell-filled" />
          执行监听器
        </template>
        <ElementListeners :id="elementId" :type="elementType" />
      </CollapsePanel>
      <CollapsePanel key="taskListeners" v-if="elementType === 'UserTask'">
        <template #title>
          <Icon icon="ant-design:bell-filled" />
          任务监听器
        </template>
        <UserTaskListeners :id="elementId" :type="elementType" />
      </CollapsePanel>
      <CollapsePanel key="extensions">
        <template #title>
          <Icon icon="ant-design:plus-circle-filled" />
          扩展属性
        </template>
        <ElementProperties :id="elementId" :type="elementType" />
      </CollapsePanel>
      <CollapsePanel key="other">
        <template #title>
          <Icon icon="ant-design:swap-right" />
          其他
        </template>
        <ElementOtherConfig :id="elementId" />
      </CollapsePanel>
      <CollapsePanel key="customConfig">
        <template #title>
          <Icon icon="ant-design:tool-filled" />
          自定义配置
        </template>
        <element-custom-config
          :id="elementId"
          :type="elementType"
          :business-object="elementBusinessObject"
        />
      </CollapsePanel>
      <!-- 新增的时间事件配置项 -->
      <CollapsePanel
        key="timeEvent"
        v-if="elementType === 'IntermediateCatchEvent'"
      >
        <template #title>
          <Icon icon="ant-design:clock-circle-filled" />
          时间事件
        </template>
        <TimeEventConfig
          :business-object="bpmnElement.value?.businessObject"
          :key="elementId"
        />
      </CollapsePanel>
    </Collapse>
  </div>
</template>
