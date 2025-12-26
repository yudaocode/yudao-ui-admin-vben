<script lang="ts" setup>
import { inject, nextTick, ref, watch } from 'vue';

import { confirm, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { cloneDeep } from '@vben/utils';

import {
  ElButton,
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { ProcessListenerSelectModal } from '#/views/bpm/processListener/components';

import { createListenerObject, updateElementExtensions } from '../../utils';
import ListenerFieldModal from './ListenerFieldModal.vue';
import {
  eventType,
  fieldType,
  initListenerForm,
  initListenerForm2,
  initListenerType,
  listenerType,
} from './utilSelf';

defineOptions({ name: 'UserTaskListeners' });

const props = defineProps<Props>();

interface Props {
  id?: string;
  type?: string;
}

const prefix = inject<string>('prefix');

const elementListenersList = ref<any[]>([]);
const listenerEventTypeObject = ref(eventType);
const listenerTypeObject = ref(listenerType);
const listenerForm = ref<any>({});
const fieldTypeObject = ref(fieldType);
const fieldsListOfListener = ref<any[]>([]);
const editingListenerIndex = ref(-1);
const editingListenerFieldIndex = ref<any>(-1);
const bpmnElementListeners = ref<any[]>([]);
const otherExtensionList = ref<any[]>([]);
const listenerFormRef = ref<any>({});

const bpmnInstances = () => (window as any)?.bpmnInstances;

const resetListenersList = () => {
  const instances = bpmnInstances();
  if (!instances || !instances.bpmnElement) return;

  // 直接使用原始BPMN元素，避免Vue响应式代理问题
  const bpmnElement = instances.bpmnElement;
  const businessObject = bpmnElement.businessObject;

  otherExtensionList.value =
    businessObject?.extensionElements?.values?.filter(
      (ex: any) => ex.$type !== `${prefix}:TaskListener`,
    ) ?? [];
  bpmnElementListeners.value =
    businessObject?.extensionElements?.values?.filter(
      (ex: any) => ex.$type === `${prefix}:TaskListener`,
    ) ?? [];
  elementListenersList.value = bpmnElementListeners.value.map((listener) =>
    initListenerType(listener),
  );
};

const openListenerForm = (listener: any, index?: number) => {
  if (listener) {
    listenerForm.value = initListenerForm(listener);
    editingListenerIndex.value = index || -1;
  } else {
    listenerForm.value = {};
    editingListenerIndex.value = -1;
  }
  if (listener && listener.fields) {
    fieldsListOfListener.value = listener.fields.map((field: any) => ({
      ...field,
      fieldType: field.string ? 'string' : 'expression',
    }));
  } else {
    fieldsListOfListener.value = [];
    listenerForm.value.fields = [];
  }
  listenerDrawerApi.open();
  nextTick(() => {
    if (listenerFormRef.value) listenerFormRef.value.clearValidate();
  });
};

const removeListener = (_: any, index: number) => {
  confirm({
    title: '提示',
    content: '确认移除该监听器吗？',
  }).then(() => {
    const instances = bpmnInstances();
    if (!instances || !instances.bpmnElement) return;

    bpmnElementListeners.value.splice(index, 1);
    elementListenersList.value.splice(index, 1);
    updateElementExtensions(instances.bpmnElement, [
      ...otherExtensionList.value,
      ...bpmnElementListeners.value,
    ]);
  });
};

async function saveListenerConfig() {
  try {
    await listenerFormRef.value.validate();
  } catch {
    return;
  }

  const instances = bpmnInstances();
  if (!instances || !instances.bpmnElement) return;

  const bpmnElement = instances.bpmnElement;
  const listenerObject = createListenerObject(listenerForm.value, true, prefix);

  if (editingListenerIndex.value === -1) {
    bpmnElementListeners.value.push(listenerObject);
    elementListenersList.value.push(listenerForm.value);
  } else {
    bpmnElementListeners.value.splice(
      editingListenerIndex.value,
      1,
      listenerObject,
    );
    elementListenersList.value.splice(
      editingListenerIndex.value,
      1,
      listenerForm.value,
    );
  }
  otherExtensionList.value =
    bpmnElement.businessObject?.extensionElements?.values?.filter(
      (ex: any) => ex.$type !== `${prefix}:TaskListener`,
    ) ?? [];
  updateElementExtensions(bpmnElement, [
    ...otherExtensionList.value,
    ...bpmnElementListeners.value,
  ]);
  listenerDrawerApi.close();
  listenerForm.value = {};
}

const openListenerFieldForm = (field: any, index?: number) => {
  const data = field ? cloneDeep(field) : {};
  editingListenerFieldIndex.value = field ? index : -1;
  fieldModalApi.setData(data).open();
};

const [ListenerGrid, listenerGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { type: 'seq', width: 50, title: '序号' },
      {
        field: 'event',
        title: '事件类型',
        minWidth: 80,
        formatter: ({ cellValue }: { cellValue: string }) =>
          (listenerEventTypeObject.value as Record<string, any>)[cellValue],
      },
      { field: 'id', title: '事件id', minWidth: 80, showOverflow: true },
      {
        field: 'listenerType',
        title: '监听器类型',
        minWidth: 80,
        formatter: ({ cellValue }: { cellValue: string }) =>
          (listenerTypeObject.value as Record<string, any>)[cellValue],
      },
      {
        title: '操作',
        width: 120,
        slots: { default: 'action' },
        fixed: 'right',
      },
    ],
    border: true,
    showOverflow: true,
    height: 'auto',
    toolbarConfig: {
      enabled: false,
    },
    pagerConfig: {
      enabled: false,
    },
  },
});

async function saveListenerField(data: any) {
  if (editingListenerFieldIndex.value === -1) {
    fieldsListOfListener.value.push(data);
    listenerForm.value.fields.push(data);
  } else {
    fieldsListOfListener.value.splice(editingListenerFieldIndex.value, 1, data);
    listenerForm.value.fields.splice(editingListenerFieldIndex.value, 1, data);
  }
}

const removeListenerField = (_: any, index: number) => {
  confirm({
    title: '提示',
    content: '确认移除该字段吗？',
  }).then(() => {
    fieldsListOfListener.value.splice(index, 1);
    listenerForm.value.fields.splice(index, 1);
  });
};

const openProcessListenerDialog = async () => {
  processListenerSelectModalApi.setData({ type: 'task' }).open();
};
const selectProcessListener = (listener: any) => {
  const instances = bpmnInstances();
  if (!instances || !instances.bpmnElement) return;

  const bpmnElement = instances.bpmnElement;
  const listenerForm = initListenerForm2(listener);
  listenerForm.id = listener.id;
  const listenerObject = createListenerObject(listenerForm, true, prefix);
  bpmnElementListeners.value.push(listenerObject);
  elementListenersList.value.push(listenerForm);

  otherExtensionList.value =
    bpmnElement.businessObject?.extensionElements?.values?.filter(
      (ex: any) => ex.$type !== `${prefix}:TaskListener`,
    ) ?? [];
  updateElementExtensions(
    bpmnElement,
    otherExtensionList.value?.concat(bpmnElementListeners.value),
  );
};

const [ListenerDrawer, listenerDrawerApi] = useVbenDrawer({
  title: '任务监听器',
  destroyOnClose: true,
  onConfirm: saveListenerConfig,
});

const [FieldModal, fieldModalApi] = useVbenModal({
  connectedComponent: ListenerFieldModal,
});

const [ProcessListenerSelectModalComp, processListenerSelectModalApi] =
  useVbenModal({
    connectedComponent: ProcessListenerSelectModal,
    destroyOnClose: true,
  });

const [FieldsGrid, fieldsGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { type: 'seq', width: 50, title: '序号' },
      { field: 'name', title: '字段名称', minWidth: 100 },
      {
        field: 'fieldType',
        title: '字段类型',
        width: 80,
        formatter: ({ cellValue }: { cellValue: string }) =>
          fieldTypeObject.value[cellValue as keyof typeof fieldType],
      },
      {
        title: '字段值/表达式',
        width: 100,
        formatter: ({ row }: { row: any }) => row.string || row.expression,
      },
      {
        title: '操作',
        width: 120,
        slots: { default: 'action' },
        fixed: 'right',
      },
    ],
    border: true,
    showOverflow: true,
    minHeight: 200,
    toolbarConfig: {
      enabled: false,
    },
    pagerConfig: {
      enabled: false,
    },
  },
});

watch(
  elementListenersList,
  (val) => {
    listenerGridApi.setGridOptions({ data: val });
  },
  { deep: true },
);

watch(
  fieldsListOfListener,
  (val) => {
    fieldsGridApi.setGridOptions({ data: val });
  },
  { deep: true },
);

watch(
  () => props.id,
  (val) => {
    val &&
      val.length > 0 &&
      nextTick(() => {
        resetListenersList();
      });
  },
  { immediate: true },
);
</script>
<template>
  <div class="-mx-2 mb-2">
    <ListenerGrid>
      <template #action="{ row, rowIndex }">
        <ElButton
          size="small"
          type="primary"
          link
          @click="openListenerForm(row, rowIndex)"
        >
          编辑
        </ElButton>
        <ElDivider direction="vertical" />
        <ElButton
          size="small"
          type="danger"
          link
          @click="removeListener(row, rowIndex)"
        >
          移除
        </ElButton>
      </template>
    </ListenerGrid>
    <div class="mt-1 flex w-full items-center justify-center gap-2 px-2">
      <ElButton
        class="flex flex-1 items-center justify-center"
        size="small"
        type="primary"
        @click="openListenerForm(null)"
      >
        <template #icon> <IconifyIcon icon="ep:plus" /></template>
        添加监听器
      </ElButton>
      <ElButton
        class="flex flex-1 items-center justify-center"
        size="small"
        @click="openProcessListenerDialog"
      >
        <template #icon> <IconifyIcon icon="ep:select" /></template>
        选择监听器
      </ElButton>
    </div>

    <!-- 监听器 编辑/创建 部分 -->
    <ListenerDrawer class="w-2/5">
      <template #default>
        <ElForm :model="listenerForm" ref="listenerFormRef" label-width="90px">
          <ElFormItem
            label="事件类型"
            prop="event"
            :rules="[{ required: true, message: '请选择事件类型' }]"
          >
            <ElSelect v-model="listenerForm.event">
              <ElOption
                v-for="i in Object.keys(listenerEventTypeObject)"
                :key="i"
                :value="i"
                :label="listenerEventTypeObject[i as keyof typeof eventType]"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem
            label="监听器ID"
            prop="id"
            :rules="[{ required: true, message: '请输入监听器ID' }]"
          >
            <ElInput v-model="listenerForm.id" clearable />
          </ElFormItem>
          <ElFormItem
            label="监听器类型"
            prop="listenerType"
            :rules="[{ required: true, message: '请选择监听器类型' }]"
          >
            <ElSelect v-model="listenerForm.listenerType">
              <ElOption
                v-for="i in Object.keys(listenerTypeObject)"
                :key="i"
                :value="i"
                :label="listenerTypeObject[i as keyof typeof listenerType]"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem
            v-if="listenerForm.listenerType === 'classListener'"
            label="Java类"
            prop="class"
            key="listener-class"
            :rules="[{ required: true, message: '请输入Java类' }]"
          >
            <ElInput v-model="listenerForm.class" clearable />
          </ElFormItem>
          <ElFormItem
            v-if="listenerForm.listenerType === 'expressionListener'"
            label="表达式"
            prop="expression"
            key="listener-expression"
            :rules="[{ required: true, message: '请输入表达式' }]"
          >
            <ElInput v-model="listenerForm.expression" clearable />
          </ElFormItem>
          <ElFormItem
            v-if="listenerForm.listenerType === 'delegateExpressionListener'"
            label="代理表达式"
            prop="delegateExpression"
            key="listener-delegate"
            :rules="[{ required: true, message: '请输入代理表达式' }]"
          >
            <ElInput v-model="listenerForm.delegateExpression" clearable />
          </ElFormItem>
          <template v-if="listenerForm.listenerType === 'scriptListener'">
            <ElFormItem
              label="脚本格式"
              prop="scriptFormat"
              key="listener-script-format"
              :rules="[{ required: true, message: '请填写脚本格式' }]"
            >
              <ElInput v-model="listenerForm.scriptFormat" clearable />
            </ElFormItem>
            <ElFormItem
              label="脚本类型"
              prop="scriptType"
              key="listener-script-type"
              :rules="[{ required: true, message: '请选择脚本类型' }]"
            >
              <ElSelect v-model="listenerForm.scriptType">
                <ElOption value="inlineScript" label="内联脚本" />
                <ElOption value="externalScript" label="外部脚本" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem
              v-if="listenerForm.scriptType === 'inlineScript'"
              label="脚本内容"
              prop="value"
              key="listener-script"
              :rules="[{ required: true, message: '请填写脚本内容' }]"
            >
              <ElInput v-model="listenerForm.value" clearable />
            </ElFormItem>
            <ElFormItem
              v-if="listenerForm.scriptType === 'externalScript'"
              label="资源地址"
              prop="resource"
              key="listener-resource"
              :rules="[{ required: true, message: '请填写资源地址' }]"
            >
              <ElInput v-model="listenerForm.resource" clearable />
            </ElFormItem>
          </template>

          <template v-if="listenerForm.event === 'timeout'">
            <ElFormItem
              label="定时器类型"
              prop="eventDefinitionType"
              key="eventDefinitionType"
            >
              <ElSelect v-model="listenerForm.eventDefinitionType">
                <ElOption value="date" label="日期" />
                <ElOption value="duration" label="持续时长" />
                <ElOption value="cycle" label="循环" />
                <ElOption value="null" label="无" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem
              v-if="
                !!listenerForm.eventDefinitionType &&
                listenerForm.eventDefinitionType !== 'null'
              "
              label="定时器"
              prop="eventTimeDefinitions"
              key="eventTimeDefinitions"
              :rules="[{ required: true, message: '请填写定时器配置' }]"
            >
              <ElInput v-model="listenerForm.eventTimeDefinitions" clearable />
            </ElFormItem>
          </template>
        </ElForm>

        <ElDivider />
        <div class="mb-2 flex justify-between">
          <span class="flex items-center">
            <IconifyIcon icon="ep:menu" class="mr-2 text-gray-600" />
            注入字段
          </span>
          <ElButton
            class="flex items-center"
            size="small"
            type="primary"
            link
            @click="openListenerFieldForm(null)"
          >
            <template #icon>
              <IconifyIcon class="size-4" icon="ep:plus" />
            </template>
            添加字段
          </ElButton>
        </div>
        <FieldsGrid>
          <template #action="{ row, rowIndex }">
            <ElButton
              size="small"
              type="primary"
              link
              @click="openListenerFieldForm(row, rowIndex)"
            >
              编辑
            </ElButton>
            <ElDivider direction="vertical" />
            <ElButton
              size="small"
              type="danger"
              link
              @click="removeListenerField(row, rowIndex)"
            >
              移除
            </ElButton>
          </template>
        </FieldsGrid>
      </template>
    </ListenerDrawer>

    <!-- 注入字段 编辑/创建 部分 -->
    <FieldModal @confirm="saveListenerField" />
  </div>

  <!-- 选择弹窗 -->
  <ProcessListenerSelectModalComp @select="selectProcessListener" />
</template>
