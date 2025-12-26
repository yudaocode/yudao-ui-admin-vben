<script lang="ts" setup>
import { nextTick, onBeforeUnmount, ref, toRaw, watch } from 'vue';

import { ElForm, ElFormItem, ElInput, ElOption, ElSelect } from 'element-plus';

defineOptions({ name: 'FlowCondition' });

const props = defineProps({
  businessObject: {
    type: Object,
    default: () => ({}),
  },
  type: {
    type: String,
    default: '',
  },
});

const flowConditionForm = ref<any>({});
const bpmnElement = ref();
const bpmnElementSource = ref();
const bpmnElementSourceRef = ref();
const flowConditionRef = ref();
const bpmnInstances = () => (window as any)?.bpmnInstances;

const resetFlowCondition = () => {
  bpmnElement.value = bpmnInstances().bpmnElement;
  bpmnElementSource.value = bpmnElement.value.source;
  bpmnElementSourceRef.value = bpmnElement.value.businessObject.sourceRef;
  // 初始化默认type为default
  flowConditionForm.value = { type: 'default' };
  if (
    bpmnElementSourceRef.value &&
    bpmnElementSourceRef.value.default &&
    bpmnElementSourceRef.value.default.id === bpmnElement.value.id
  ) {
    flowConditionForm.value = { type: 'default' };
  } else if (bpmnElement.value.businessObject.conditionExpression) {
    // 带条件
    const conditionExpression =
      bpmnElement.value.businessObject.conditionExpression;
    flowConditionForm.value = { ...conditionExpression, type: 'condition' };
    // resource 可直接标识 是否是外部资源脚本
    if (flowConditionForm.value.resource) {
      // this.$set(this.flowConditionForm, "conditionType", "script");
      // this.$set(this.flowConditionForm, "scriptType", "externalScript");
      flowConditionForm.value.conditionType = 'script';
      flowConditionForm.value.scriptType = 'externalScript';
      return;
    }
    if (conditionExpression.language) {
      // this.$set(this.flowConditionForm, "conditionType", "script");
      // this.$set(this.flowConditionForm, "scriptType", "inlineScript");
      flowConditionForm.value.conditionType = 'script';
      flowConditionForm.value.scriptType = 'inlineScript';

      return;
    }
    // this.$set(this.flowConditionForm, "conditionType", "expression");
    flowConditionForm.value.conditionType = 'expression';
  } else {
    // 普通
    flowConditionForm.value = { type: 'normal' };
  }
};

const updateFlowType = (flowType: any) => {
  // 正常条件类
  if (flowType === 'condition') {
    flowConditionRef.value = bpmnInstances().moddle.create(
      'bpmn:FormalExpression',
    );
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
      conditionExpression: flowConditionRef.value,
    });
    return;
  }
  // 默认路径
  if (flowType === 'default') {
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
      conditionExpression: null,
    });
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElementSource.value), {
      default: toRaw(bpmnElement.value),
    });
    return;
  }
  // 正常路径，如果来源节点的默认路径是当前连线时，清除父元素的默认路径配置
  if (
    bpmnElementSourceRef.value.default &&
    bpmnElementSourceRef.value.default.id === bpmnElement.value.id
  ) {
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElementSource.value), {
      default: null,
    });
  }
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    conditionExpression: null,
  });
};

const updateFlowCondition = () => {
  const { conditionType, scriptType, body, resource, language } =
    flowConditionForm.value;
  let condition;
  if (conditionType === 'expression') {
    condition = bpmnInstances().moddle.create('bpmn:FormalExpression', {
      body,
    });
  } else {
    if (scriptType === 'inlineScript') {
      condition = bpmnInstances().moddle.create('bpmn:FormalExpression', {
        body,
        language,
      });
      // this.$set(this.flowConditionForm, "resource", "");
      flowConditionForm.value.resource = '';
    } else {
      // this.$set(this.flowConditionForm, "body", "");
      flowConditionForm.value.body = '';
      condition = bpmnInstances().moddle.create('bpmn:FormalExpression', {
        resource,
        language,
      });
    }
  }
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    conditionExpression: condition,
  });
};

onBeforeUnmount(() => {
  bpmnElement.value = null;
  bpmnElementSource.value = null;
  bpmnElementSourceRef.value = null;
});

watch(
  () => props.businessObject,
  (_) => {
    // console.log(val, 'val');
    nextTick(() => {
      resetFlowCondition();
    });
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <div class="panel-tab__content">
    <ElForm :model="flowConditionForm" label-width="80px">
      <ElFormItem label="流转类型">
        <ElSelect v-model="flowConditionForm.type" @change="updateFlowType">
          <ElOption value="normal" label="普通流转路径" />
          <ElOption value="default" label="默认流转路径" />
          <ElOption value="condition" label="条件流转路径" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem
        label="条件格式"
        v-if="flowConditionForm.type === 'condition'"
        key="condition"
      >
        <ElSelect v-model="flowConditionForm.conditionType">
          <ElOption value="expression" label="表达式" />
          <ElOption value="script" label="脚本" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem
        label="表达式"
        v-if="
          flowConditionForm.conditionType &&
          flowConditionForm.conditionType === 'expression'
        "
        key="express"
      >
        <ElInput
          type="textarea"
          v-model="flowConditionForm.body"
          :autosize="{ minRows: 2, maxRows: 6 }"
          clearable
          @change="updateFlowCondition"
        />
      </ElFormItem>
      <template
        v-if="
          flowConditionForm.conditionType &&
          flowConditionForm.conditionType === 'script'
        "
      >
        <ElFormItem label="脚本语言" key="language">
          <ElInput
            v-model="flowConditionForm.language"
            clearable
            @change="updateFlowCondition"
          />
        </ElFormItem>
        <ElFormItem label="脚本类型" key="scriptType">
          <ElSelect v-model="flowConditionForm.scriptType">
            <ElOption value="inlineScript" label="内联脚本" />
            <ElOption value="externalScript" label="外部脚本" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem
          label="脚本"
          v-if="flowConditionForm.scriptType === 'inlineScript'"
          key="body"
        >
          <ElInput
            type="textarea"
            v-model="flowConditionForm.body"
            :autosize="{ minRows: 2, maxRows: 6 }"
            clearable
            @change="updateFlowCondition"
          />
        </ElFormItem>
        <ElFormItem
          label="资源地址"
          v-if="flowConditionForm.scriptType === 'externalScript'"
          key="resource"
        >
          <ElInput
            v-model="flowConditionForm.resource"
            clearable
            @change="updateFlowCondition"
          />
        </ElFormItem>
      </template>
    </ElForm>
  </div>
</template>
