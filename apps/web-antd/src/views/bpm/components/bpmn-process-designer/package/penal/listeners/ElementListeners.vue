<script lang="ts" setup>
import { inject, nextTick, ref, watch } from 'vue';

import { confirm, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { cloneDeep } from '@vben/utils';

import {
  Button,
  Divider,
  Form,
  FormItem,
  Input,
  Select,
  SelectOption,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import ProcessListenerSelectModal from '#/views/bpm/processListener/components/process-listener-select-modal.vue';

import { createListenerObject, updateElementExtensions } from '../../utils';
import ListenerFieldModal from './ListenerFieldModal.vue';
import {
  fieldType,
  initListenerForm,
  initListenerForm2,
  initListenerType,
  listenerType,
} from './utilSelf';

defineOptions({ name: 'ElementListeners' });

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
const elementListenersList = ref<any[]>([]); // 监听器列表
const listenerForm = ref<any>({}); // 监听器详情表单
const fieldsListOfListener = ref<any[]>([]);
const editingListenerIndex = ref(-1); // 监听器所在下标，-1 为新增
const editingListenerFieldIndex = ref(-1); // 字段所在下标，-1 为新增
const listenerTypeObject = ref(listenerType);
const fieldTypeObject = ref(fieldType);
const otherExtensionList = ref();
const bpmnElementListeners = ref();
const listenerFormRef = ref();
const bpmnInstances = () => (window as any)?.bpmnInstances;

const resetListenersList = () => {
  const instances = bpmnInstances();
  if (!instances || !instances.bpmnElement) return;

  // 直接使用原始BPMN元素，避免Vue响应式代理问题
  const bpmnElement = instances.bpmnElement;
  const businessObject = bpmnElement.businessObject;

  otherExtensionList.value =
    businessObject?.extensionElements?.values?.filter(
      (ex: any) => ex.$type !== `${prefix}:ExecutionListener`,
    ) ?? []; // 保留非监听器类型的扩展属性，避免移除监听器时清空其他配置（如审批人等）。相关案例：https://gitee.com/yudaocode/yudao-ui-admin-vue3/issues/ICMSYC
  bpmnElementListeners.value =
    businessObject?.extensionElements?.values?.filter(
      (ex: any) => ex.$type === `${prefix}:ExecutionListener`,
    ) ?? [];
  elementListenersList.value = bpmnElementListeners.value.map((listener: any) =>
    initListenerType(listener),
  );
};
// 打开 监听器详情 侧边栏
const openListenerForm = (listener: any, index: number) => {
  if (listener) {
    listenerForm.value = initListenerForm(listener);
    editingListenerIndex.value = index;
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
    if (listenerFormRef.value) {
      listenerFormRef.value.clearValidate();
    }
  });
};

// 打开监听器字段编辑弹窗
const openListenerFieldForm = (field: any, index: number) => {
  const data = field ? cloneDeep(field) : {};
  editingListenerFieldIndex.value = field ? index : -1;
  fieldModalApi.setData(data).open();
};
// 保存监听器注入字段
const saveListenerFiled = async (data: any) => {
  if (editingListenerFieldIndex.value === -1) {
    fieldsListOfListener.value.push(data);
    listenerForm.value.fields.push(data);
  } else {
    fieldsListOfListener.value.splice(editingListenerFieldIndex.value, 1, data);
    listenerForm.value.fields.splice(editingListenerFieldIndex.value, 1, data);
  }
};
// 移除监听器字段
const removeListenerField = (index: number) => {
  confirm({
    title: '提示',
    content: '确认移除该字段吗？',
  }).then(() => {
    fieldsListOfListener.value.splice(index, 1);
    listenerForm.value.fields.splice(index, 1);
  });
};
// 移除监听器
const removeListener = (index: number) => {
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
// 保存监听器配置
const saveListenerConfig = async () => {
  try {
    await listenerFormRef.value.validate();
  } catch {
    return;
  }
  const listenerObject = createListenerObject(
    listenerForm.value,
    false,
    prefix,
  );

  const instances = bpmnInstances();
  if (!instances || !instances.bpmnElement) return;

  const bpmnElement = instances.bpmnElement;

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
      (ex: any) => ex.$type !== `${prefix}:ExecutionListener`,
    ) ?? [];
  updateElementExtensions(bpmnElement, [
    ...otherExtensionList.value,
    ...bpmnElementListeners.value,
  ]);
  listenerDrawerApi.close();
  listenerForm.value = {};
};

// 配置主列表 Grid
const [ListenerGrid, listenerGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { type: 'seq', width: 50, title: '序号' },
      { field: 'event', title: '事件类型', minWidth: 100 },
      {
        field: 'listenerType',
        title: '监听器类型',
        minWidth: 100,
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

// 配置字段列表 Grid
const [FieldsGrid, fieldsGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { type: 'seq', width: 50, title: '序号' },
      { field: 'name', title: '字段名称', minWidth: 100 },
      {
        field: 'fieldType',
        title: '字段类型',
        minWidth: 80,
        formatter: ({ cellValue }: { cellValue: string }) =>
          (fieldTypeObject.value as Record<string, any>)[cellValue],
      },
      {
        title: '字段值/表达式',
        minWidth: 100,
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
    maxHeight: 200,
    toolbarConfig: {
      enabled: false,
    },
    pagerConfig: {
      enabled: false,
    },
  },
});

// 配置 Drawer
const [ListenerDrawer, listenerDrawerApi] = useVbenDrawer({
  title: '执行监听器',
  destroyOnClose: true,
  onConfirm: saveListenerConfig,
});

// 配置字段 Modal
const [FieldModal, fieldModalApi] = useVbenModal({
  connectedComponent: ListenerFieldModal,
});

// 配置选择监听器 Modal
const [ProcessListenerSelectModalComp, processListenerSelectModalApi] =
  useVbenModal({
    connectedComponent: ProcessListenerSelectModal,
    destroyOnClose: true,
  });

// 打开监听器弹窗
const openProcessListenerDialog = async () => {
  processListenerSelectModalApi.setData({ type: 'execution' }).open();
};
const selectProcessListener = (listener: any) => {
  const instances = bpmnInstances();
  if (!instances || !instances.bpmnElement) return;

  const bpmnElement = instances.bpmnElement;
  const listenerForm = initListenerForm2(listener);
  const listenerObject = createListenerObject(listenerForm, false, prefix);
  bpmnElementListeners.value.push(listenerObject);
  elementListenersList.value.push(listenerForm);

  // 保存其他配置
  otherExtensionList.value =
    bpmnElement.businessObject?.extensionElements?.values?.filter(
      (ex: any) => ex.$type !== `${prefix}:ExecutionListener`,
    ) ?? [];
  updateElementExtensions(bpmnElement, [
    ...otherExtensionList.value,
    ...bpmnElementListeners.value,
  ]);
};

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
  (val: string) => {
    if (val && val.length > 0) {
      nextTick(() => {
        resetListenersList();
      });
    }
  },
  { immediate: true },
);
</script>
<template>
  <div class="-mx-2">
    <ListenerGrid :data="elementListenersList">
      <template #action="{ row, rowIndex }">
        <Button
          size="small"
          type="link"
          @click="openListenerForm(row, rowIndex)"
        >
          编辑
        </Button>
        <Divider type="vertical" />
        <Button
          size="small"
          type="link"
          danger
          @click="removeListener(rowIndex)"
        >
          移除
        </Button>
      </template>
    </ListenerGrid>
    <div class="mt-1 flex w-full items-center justify-center gap-2 px-2">
      <Button
        class="flex flex-1 items-center justify-center"
        type="primary"
        size="small"
        @click="openListenerForm(null, -1)"
      >
        <template #icon>
          <IconifyIcon icon="ep:plus" />
        </template>
        添加监听器
      </Button>
      <Button
        class="flex flex-1 items-center justify-center"
        size="small"
        @click="openProcessListenerDialog"
      >
        <template #icon>
          <IconifyIcon icon="ep:select" />
        </template>
        选择监听器
      </Button>
    </div>

    <!-- 监听器 编辑/创建 部分 -->
    <ListenerDrawer>
      <Form
        :model="listenerForm"
        ref="listenerFormRef"
        :label-col="{ span: 5 }"
        :wrapper-col="{ span: 19 }"
      >
        <FormItem
          label="事件类型"
          name="event"
          :rules="[
            {
              required: true,
              message: '请选择事件类型',
              trigger: ['blur', 'change'],
            },
          ]"
        >
          <Select v-model:value="listenerForm.event">
            <SelectOption value="start">start</SelectOption>
            <SelectOption value="end">end</SelectOption>
          </Select>
        </FormItem>
        <FormItem
          label="监听器类型"
          name="listenerType"
          :rules="[
            {
              required: true,
              message: '请选择监听器类型',
              trigger: ['blur', 'change'],
            },
          ]"
        >
          <Select v-model:value="listenerForm.listenerType">
            <SelectOption
              v-for="i in Object.keys(listenerTypeObject)"
              :key="i"
              :value="i"
            >
              {{ listenerTypeObject[i as keyof typeof listenerType] }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem
          v-if="listenerForm.listenerType === 'classListener'"
          label="Java类"
          name="class"
          key="listener-class"
          :rules="[
            {
              required: true,
              message: '请填写Java类',
              trigger: ['blur', 'change'],
            },
          ]"
        >
          <Input v-model:value="listenerForm.class" allow-clear />
        </FormItem>
        <FormItem
          v-if="listenerForm.listenerType === 'expressionListener'"
          label="表达式"
          name="expression"
          key="listener-expression"
          :rules="[
            {
              required: true,
              message: '请填写表达式',
              trigger: ['blur', 'change'],
            },
          ]"
        >
          <Input v-model:value="listenerForm.expression" allow-clear />
        </FormItem>
        <FormItem
          v-if="listenerForm.listenerType === 'delegateExpressionListener'"
          label="代理表达式"
          name="delegateExpression"
          key="listener-delegate"
          :rules="[
            {
              required: true,
              message: '请填写代理表达式',
              trigger: ['blur', 'change'],
            },
          ]"
        >
          <Input v-model:value="listenerForm.delegateExpression" allow-clear />
        </FormItem>
        <template v-if="listenerForm.listenerType === 'scriptListener'">
          <FormItem
            label="脚本格式"
            name="scriptFormat"
            key="listener-script-format"
            :rules="[
              {
                required: true,
                trigger: ['blur', 'change'],
                message: '请填写脚本格式',
              },
            ]"
          >
            <Input v-model:value="listenerForm.scriptFormat" allow-clear />
          </FormItem>
          <FormItem
            label="脚本类型"
            name="scriptType"
            key="listener-script-type"
            :rules="[
              {
                required: true,
                trigger: ['blur', 'change'],
                message: '请选择脚本类型',
              },
            ]"
          >
            <Select v-model:value="listenerForm.scriptType">
              <SelectOption value="inlineScript">内联脚本</SelectOption>
              <SelectOption value="externalScript">外部脚本</SelectOption>
            </Select>
          </FormItem>
          <FormItem
            v-if="listenerForm.scriptType === 'inlineScript'"
            label="脚本内容"
            name="value"
            key="listener-script"
            :rules="[
              {
                required: true,
                trigger: ['blur', 'change'],
                message: '请填写脚本内容',
              },
            ]"
          >
            <Input v-model:value="listenerForm.value" allow-clear />
          </FormItem>
          <FormItem
            v-if="listenerForm.scriptType === 'externalScript'"
            label="资源地址"
            name="resource"
            key="listener-resource"
            :rules="[
              {
                required: true,
                trigger: ['blur', 'change'],
                message: '请填写资源地址',
              },
            ]"
          >
            <Input v-model:value="listenerForm.resource" allow-clear />
          </FormItem>
        </template>
      </Form>
      <Divider />
      <div class="mb-2 flex justify-between">
        <span class="flex items-center">
          <IconifyIcon icon="ep:menu" class="mr-2 text-gray-600" />
          注入字段
        </span>
        <Button
          class="flex items-center"
          size="small"
          type="link"
          @click="openListenerFieldForm(null, -1)"
        >
          <template #icon>
            <IconifyIcon icon="ep:plus" />
          </template>
          添加字段
        </Button>
      </div>
      <FieldsGrid :data="fieldsListOfListener">
        <template #action="{ row, rowIndex }">
          <Button
            size="small"
            type="link"
            @click="openListenerFieldForm(row, rowIndex)"
          >
            编辑
          </Button>
          <Divider type="vertical" />
          <Button
            size="small"
            type="link"
            danger
            @click="removeListenerField(rowIndex)"
          >
            移除
          </Button>
        </template>
      </FieldsGrid>
    </ListenerDrawer>

    <!-- 注入字段 编辑/创建 部分 -->
    <FieldModal @confirm="saveListenerFiled" />
  </div>

  <!-- 选择弹窗 -->
  <ProcessListenerSelectModalComp @select="selectProcessListener" />
</template>
