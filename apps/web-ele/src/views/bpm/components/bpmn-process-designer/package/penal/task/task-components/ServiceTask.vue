<!-- eslint-disable prettier/prettier -->
<script lang="ts" setup>
import { inject, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
} from 'element-plus';

import { updateElementExtensions } from '../../../utils';
import HttpHeaderEditor from './HttpHeaderEditor.vue';

defineOptions({ name: 'ServiceTask' });
const props = defineProps({
  id: { type: String, default: '' },
  type: { type: String, default: '' },
});

const prefix = (inject('prefix', 'flowable') || 'flowable') as string;
const flowableTypeKey = `${prefix}:type`;
const flowableFieldType = `${prefix}:Field`;

const HTTP_FIELD_NAMES = [
  'requestMethod',
  'requestUrl',
  'requestHeaders',
  'disallowRedirects',
  'ignoreException',
  'saveResponseParameters',
  'resultVariablePrefix',
  'saveResponseParametersTransient',
  'saveResponseVariableAsJson',
];
const HTTP_BOOLEAN_FIELDS = new Set([
  'disallowRedirects',
  'ignoreException',
  'saveResponseParameters',
  'saveResponseParametersTransient',
  'saveResponseVariableAsJson',
]);

const DEFAULT_TASK_FORM = {
  executeType: '',
  class: '',
  expression: '',
  delegateExpression: '',
};

const DEFAULT_HTTP_FORM = {
  requestMethod: 'GET',
  requestUrl: '',
  requestHeaders: 'Content-Type: application/json',
  resultVariablePrefix: '',
  disallowRedirects: false,
  ignoreException: false,
  saveResponseParameters: false,
  saveResponseParametersTransient: false,
  saveResponseVariableAsJson: false,
};

const serviceTaskForm = ref({ ...DEFAULT_TASK_FORM });
const httpTaskForm = ref<any>({ ...DEFAULT_HTTP_FORM });
const bpmnElement = ref();
const httpInitializing = ref(false);

const bpmnInstances = () => (window as any)?.bpmnInstances;

// 判断字符串是否包含表达式
const isExpression = (value: string): boolean => {
  if (!value) return false;
  // 检测 ${...} 或 #{...} 格式的表达式
  return /\$\{[^}]+\}/.test(value) || /#\{[^}]+\}/.test(value);
};

const collectHttpExtensionInfo = () => {
  const businessObject = bpmnElement.value?.businessObject;
  const extensionElements = businessObject?.extensionElements;
  const httpFields = new Map<string, string>();
  const httpFieldTypes = new Map<string, 'expression' | 'string'>();
  const otherExtensions: any[] = [];

  extensionElements?.values?.forEach((item: any) => {
    if (
      item?.$type === flowableFieldType &&
      HTTP_FIELD_NAMES.includes(item.name)
    ) {
      const value = item.string ?? item.stringValue ?? item.expression ?? '';
      const fieldType = item.expression ? 'expression' : 'string';
      httpFields.set(item.name, value);
      httpFieldTypes.set(item.name, fieldType);
    } else {
      otherExtensions.push(item);
    }
  });

  return { httpFields, httpFieldTypes, otherExtensions };
};

const resetHttpDefaults = () => {
  httpInitializing.value = true;
  httpTaskForm.value = { ...DEFAULT_HTTP_FORM };
  nextTick(() => {
    httpInitializing.value = false;
  });
};

const resetHttpForm = () => {
  httpInitializing.value = true;
  const { httpFields } = collectHttpExtensionInfo();
  const nextForm: any = { ...DEFAULT_HTTP_FORM };

  HTTP_FIELD_NAMES.forEach((name) => {
    const stored = httpFields.get(name);
    if (stored !== undefined) {
      nextForm[name] = HTTP_BOOLEAN_FIELDS.has(name)
        ? stored === 'true'
        : stored;
    }
  });

  httpTaskForm.value = nextForm;
  nextTick(() => {
    httpInitializing.value = false;
    updateHttpExtensions(true);
  });
};

const resetServiceTaskForm = () => {
  const businessObject = bpmnElement.value?.businessObject;
  const nextForm = { ...DEFAULT_TASK_FORM };

  if (businessObject) {
    if (businessObject.class) {
      nextForm.class = businessObject.class;
      nextForm.executeType = 'class';
    }
    if (businessObject.expression) {
      nextForm.expression = businessObject.expression;
      nextForm.executeType = 'expression';
    }
    if (businessObject.delegateExpression) {
      nextForm.delegateExpression = businessObject.delegateExpression;
      nextForm.executeType = 'delegateExpression';
    }
    if (businessObject.$attrs?.[flowableTypeKey] === 'http') {
      nextForm.executeType = 'http';
    } else {
      // 兜底：如缺少 flowable:type=http，但扩展里已有 HTTP 的字段，也认为是 HTTP
      const { httpFields } = collectHttpExtensionInfo();
      if (httpFields.size > 0) {
        nextForm.executeType = 'http';
      }
    }
  }

  serviceTaskForm.value = nextForm;

  if (nextForm.executeType === 'http') {
    resetHttpForm();
  } else {
    resetHttpDefaults();
  }
};

const shouldPersistField = (name: string, value: any) => {
  if (HTTP_BOOLEAN_FIELDS.has(name)) return true;
  if (name === 'requestMethod') return true;
  if (name === 'requestUrl') return !!value;
  return value !== undefined && value !== '';
};

const updateHttpExtensions = (force = false) => {
  const instances = bpmnInstances();
  if (!instances || !instances.bpmnElement) return;
  // 直接使用原始BPMN元素，避免Vue响应式代理问题
  const bpmnElement = instances.bpmnElement;
  if (
    !force &&
    (httpInitializing.value || serviceTaskForm.value.executeType !== 'http')
  ) {
    return;
  }

  const {
    httpFields: existingFields,
    httpFieldTypes: existingTypes,
    otherExtensions,
  } = collectHttpExtensionInfo();

  const desiredEntries: [string, string][] = [];
  HTTP_FIELD_NAMES.forEach((name) => {
    const rawValue = httpTaskForm.value[name];
    if (!shouldPersistField(name, rawValue)) {
      return;
    }

    const persisted = HTTP_BOOLEAN_FIELDS.has(name)
      ? String(!!rawValue)
      : (rawValue === undefined
        ? ''
        : rawValue.toString());

    desiredEntries.push([name, persisted]);
  });

  // 检查是否有变化：不仅比较值，还要比较字段类型（string vs expression）
  if (!force && desiredEntries.length === existingFields.size) {
    let noChange = true;
    for (const [name, value] of desiredEntries) {
      const existingValue = existingFields.get(name);
      const existingType = existingTypes.get(name);
      const currentType = isExpression(value) ? 'expression' : 'string';
      if (existingValue !== value || existingType !== currentType) {
        noChange = false;
        break;
      }
    }
    if (noChange) {
      return;
    }
  }

  const moddle = bpmnInstances().moddle;
  const httpFieldElements = desiredEntries.map(([name, value]) => {
    // 根据值是否包含表达式来决定使用 string 还是 expression 属性
    const isExpr = isExpression(value);
    return moddle.create(flowableFieldType, {
      name,
      ...(isExpr ? { expression: value } : { string: value }),
    });
  });

  updateElementExtensions(bpmnElement, [
    ...otherExtensions,
    ...httpFieldElements,
  ]);
};

const removeHttpExtensions = () => {
  const instances = bpmnInstances();
  if (!instances || !instances.bpmnElement) return;
  // 直接使用原始BPMN元素，避免Vue响应式代理问题
  const bpmnElement = instances.bpmnElement;
  const { httpFields, otherExtensions } = collectHttpExtensionInfo();
  if (httpFields.size === 0) {
    return;
  }

  if (otherExtensions.length === 0) {
    bpmnInstances().modeling.updateProperties(bpmnElement, {
      extensionElements: null,
    });
    return;
  }

  updateElementExtensions(bpmnElement, otherExtensions);
};

const updateElementTask = () => {
  const instances = bpmnInstances();
  if (!instances || !instances.bpmnElement) return;
  // 直接使用原始BPMN元素，避免Vue响应式代理问题
  const bpmnElement = instances.bpmnElement;

  const taskAttr: Record<string, any> = {
    class: null,
    expression: null,
    delegateExpression: null,
    [flowableTypeKey]: null,
  };

  const type = serviceTaskForm.value.executeType;
  if (
    type === 'class' ||
    type === 'expression' ||
    type === 'delegateExpression'
  ) {
    taskAttr[type] = serviceTaskForm.value[type] || null;
  } else if (type === 'http') {
    taskAttr[flowableTypeKey] = 'http';
  }

  bpmnInstances().modeling.updateProperties(bpmnElement, taskAttr);

  if (type === 'http') {
    updateHttpExtensions(true);
  } else {
    removeHttpExtensions();
  }
};

const handleExecuteTypeChange = (value: any) => {
  serviceTaskForm.value.executeType = value;
  if (value === 'http') {
    resetHttpForm();
  }
  updateElementTask();
};

/** 打开请求头编辑器 */
const openHttpHeaderEditor = () => {
  httpHeaderEditorApi
    .setData({
      headers: httpTaskForm.value.requestHeaders,
    })
    .open();
};

/** 保存请求头 */
const handleHeadersSave = (headersStr: string) => {
  httpTaskForm.value.requestHeaders = headersStr;
};

const [HttpHeaderEditorModal, httpHeaderEditorApi] = useVbenModal({
  connectedComponent: HttpHeaderEditor,
});

onBeforeUnmount(() => {
  bpmnElement.value = null;
});

watch(
  () => props.id,
  () => {
    bpmnElement.value = bpmnInstances().bpmnElement;
    nextTick(() => {
      resetServiceTaskForm();
    });
  },
  { immediate: true },
);

watch(
  () => httpTaskForm.value,
  () => {
    updateHttpExtensions();
  },
  { deep: true },
);
</script>

<template>
  <div>
    <ElForm label-width="100px">
      <ElFormItem label="执行类型" key="executeType">
        <ElSelect
          v-model="serviceTaskForm.executeType"
          @change="handleExecuteTypeChange"
        >
          <ElOption label="Java类" value="class" />
          <ElOption label="表达式" value="expression" />
          <ElOption label="代理表达式" value="delegateExpression" />
          <ElOption label="HTTP 调用" value="http" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem
        v-if="serviceTaskForm.executeType === 'class'"
        label="Java类"
        prop="class"
        key="execute-class"
      >
        <ElInput
          v-model="serviceTaskForm.class"
          clearable
          @change="updateElementTask"
        />
      </ElFormItem>
      <ElFormItem
        v-if="serviceTaskForm.executeType === 'expression'"
        label="表达式"
        prop="expression"
        key="execute-expression"
      >
        <ElInput
          v-model="serviceTaskForm.expression"
          clearable
          @change="updateElementTask"
        />
      </ElFormItem>
      <ElFormItem
        v-if="serviceTaskForm.executeType === 'delegateExpression'"
        label="代理表达式"
        prop="delegateExpression"
        key="execute-delegate"
      >
        <ElInput
          v-model="serviceTaskForm.delegateExpression"
          clearable
          @change="updateElementTask"
        />
      </ElFormItem>
      <template v-if="serviceTaskForm.executeType === 'http'">
        <ElFormItem label="请求方法" key="http-method" prop="requestMethod">
          <ElRadioGroup v-model="httpTaskForm.requestMethod">
            <ElRadioButton value="GET">GET</ElRadioButton>
            <ElRadioButton value="POST">POST</ElRadioButton>
            <ElRadioButton value="PUT">PUT</ElRadioButton>
            <ElRadioButton value="DELETE">DELETE</ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="请求地址" key="http-url" prop="requestUrl">
          <ElInput v-model="httpTaskForm.requestUrl" clearable />
        </ElFormItem>
        <ElFormItem label="请求头" key="http-headers" prop="requestHeaders">
          <div class="flex w-full flex-col gap-2">
            <ElInput
              type="textarea"
              v-model="httpTaskForm.requestHeaders"
              :autosize="{ minRows: 4, maxRows: 8 }"
              readonly
              placeholder="点击右侧编辑按钮添加请求头"
              class="min-w-0 flex-1"
            />
            <div class="flex w-full items-center justify-center">
              <ElButton
                class="flex flex-1 items-center justify-center"
                size="small"
                type="primary"
                @click="openHttpHeaderEditor"
              >
                <template #icon>
                  <IconifyIcon icon="ep:edit" />
                </template>
                编辑
              </ElButton>
            </div>
          </div>
        </ElFormItem>
        <ElFormItem
          label="禁止重定向"
          key="http-disallow-redirects"
          prop="disallowRedirects"
        >
          <ElSwitch v-model="httpTaskForm.disallowRedirects" />
        </ElFormItem>
        <ElFormItem
          label="忽略异常"
          key="http-ignore-exception"
          prop="ignoreException"
        >
          <ElSwitch v-model="httpTaskForm.ignoreException" />
        </ElFormItem>
        <ElFormItem
          label="保存返回变量"
          key="http-save-response"
          prop="saveResponseParameters"
        >
          <ElSwitch v-model="httpTaskForm.saveResponseParameters" />
        </ElFormItem>
        <ElFormItem
          label="是否瞬间变量"
          key="http-save-transient"
          prop="saveResponseParametersTransient"
        >
          <ElSwitch v-model="httpTaskForm.saveResponseParametersTransient" />
        </ElFormItem>
        <ElFormItem
          label="返回变量前缀"
          key="http-result-variable-prefix"
          prop="resultVariablePrefix"
        >
          <ElInput v-model="httpTaskForm.resultVariablePrefix" />
        </ElFormItem>
        <ElFormItem
          label="保存为 JSON 变量"
          label-width="120px"
          key="http-save-json"
          prop="saveResponseVariableAsJson"
        >
          <ElSwitch v-model="httpTaskForm.saveResponseVariableAsJson" />
        </ElFormItem>
      </template>
    </ElForm>
    <!-- 请求头编辑器 -->
    <HttpHeaderEditorModal @save="handleHeadersSave" />
  </div>
</template>
