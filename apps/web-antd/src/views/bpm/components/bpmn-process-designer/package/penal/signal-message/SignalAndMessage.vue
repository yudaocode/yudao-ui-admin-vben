<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Divider,
  Form,
  FormItem,
  Input,
  message,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

defineOptions({ name: 'SignalAndMassage' });
const signalList = ref<any[]>([]);
const messageList = ref<any[]>([]);
const modelType = ref('');
const modelObjectForm = ref<any>({});
const formRef = ref();
const rootElements = ref();
const messageIdMap = ref();
const signalIdMap = ref();
const editingIndex = ref(-1); // 正在编辑的索引，-1 表示新建
const modelConfig = computed(() => {
  const isEdit = editingIndex.value !== -1;
  return modelType.value === 'message'
    ? {
        title: isEdit ? '编辑消息' : '创建消息',
        idLabel: '消息ID',
        nameLabel: '消息名称',
      }
    : {
        title: isEdit ? '编辑信号' : '创建信号',
        idLabel: '信号ID',
        nameLabel: '信号名称',
      };
});
const bpmnInstances = () => (window as any)?.bpmnInstances;

// 生成规范化的ID
const generateStandardId = (type: string): string => {
  const prefix = type === 'message' ? 'Message_' : 'Signal_';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${timestamp}_${random}`;
};

const initDataList = () => {
  rootElements.value = bpmnInstances().modeler.getDefinitions().rootElements;
  messageIdMap.value = {};
  signalIdMap.value = {};
  messageList.value = [];
  signalList.value = [];
  rootElements.value.forEach((el: any) => {
    if (el.$type === 'bpmn:Message') {
      messageIdMap.value[el.id] = true;
      messageList.value.push({ ...el });
    }
    if (el.$type === 'bpmn:Signal') {
      signalIdMap.value[el.id] = true;
      signalList.value.push({ ...el });
    }
  });
};

const openModel = (type: any) => {
  modelType.value = type;
  editingIndex.value = -1;
  modelObjectForm.value = {
    id: generateStandardId(type),
    name: '',
  };
  modelModalApi.open();
};

const openEditModel = (type: any, row: any, index: number) => {
  modelType.value = type;
  editingIndex.value = index;
  modelObjectForm.value = { ...row };
  modelModalApi.open();
};

const addNewObject = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    // 校验未通过，直接返回
    return;
  }

  if (modelType.value === 'message') {
    // 编辑模式
    if (editingIndex.value === -1) {
      // 新建模式
      if (messageIdMap.value[modelObjectForm.value.id]) {
        message.error('该消息已存在，请修改id后重新保存');
        return;
      }
      const messageRef = bpmnInstances().moddle.create(
        'bpmn:Message',
        modelObjectForm.value,
      );
      rootElements.value.push(messageRef);
    } else {
      const targetMessage = messageList.value[editingIndex.value];
      // 查找 rootElements 中的原始对象
      const rootMessage = rootElements.value.find(
        (el: any) => el.$type === 'bpmn:Message' && el.id === targetMessage.id,
      );
      if (rootMessage) {
        rootMessage.id = modelObjectForm.value.id;
        rootMessage.name = modelObjectForm.value.name;
      }
    }
  } else {
    // 编辑模式
    if (editingIndex.value === -1) {
      // 新建模式
      if (signalIdMap.value[modelObjectForm.value.id]) {
        message.error('该信号已存在，请修改id后重新保存');
        return;
      }
      const signalRef = bpmnInstances().moddle.create(
        'bpmn:Signal',
        modelObjectForm.value,
      );
      rootElements.value.push(signalRef);
    } else {
      const targetSignal = signalList.value[editingIndex.value];
      // 查找 rootElements 中的原始对象
      const rootSignal = rootElements.value.find(
        (el: any) => el.$type === 'bpmn:Signal' && el.id === targetSignal.id,
      );
      if (rootSignal) {
        rootSignal.id = modelObjectForm.value.id;
        rootSignal.name = modelObjectForm.value.name;
      }
    }
  }
  modelModalApi.close();
  // 触发建模器更新以保存更改。
  saveChanges();
  initDataList();
};

// 补充"编辑"、"移除"功能。相关 issue：https://github.com/YunaiV/yudao-cloud/issues/270
const removeObject = (type: any, row: any) => {
  confirm({
    title: '提示',
    content: `确认移除该${type === 'message' ? '消息' : '信号'}吗？`,
  }).then(() => {
    // 从 rootElements 中移除
    const targetType = type === 'message' ? 'bpmn:Message' : 'bpmn:Signal';
    const elementIndex = rootElements.value.findIndex(
      (el: any) => el.$type === targetType && el.id === row.id,
    );
    if (elementIndex !== -1) {
      rootElements.value.splice(elementIndex, 1);
    }
    // 刷新列表
    initDataList();
    message.success('移除成功');
  });
};

// 触发建模器更新以保存更改
const saveChanges = () => {
  const modeler = bpmnInstances().modeler;
  if (!modeler) return;

  try {
    // 获取 canvas，通过它来触发图表的重新渲染
    const canvas = modeler.get('canvas');

    // 获取根元素（Process）
    const rootElement = canvas.getRootElement();

    // 触发 changed 事件，通知建模器数据已更改
    const eventBus = modeler.get('eventBus');
    if (eventBus) {
      eventBus.fire('root.added', { element: rootElement });
      eventBus.fire('elements.changed', { elements: [rootElement] });
    }

    // 标记建模器为已修改状态
    const commandStack = modeler.get('commandStack');
    if (commandStack && commandStack._stack) {
      // 添加一个空命令以标记为已修改
      commandStack.execute('element.updateProperties', {
        element: rootElement,
        properties: {},
      });
    }
  } catch (error) {
    console.warn('保存更改时出错:', error);
  }
};

const [MessageGrid, messageGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { type: 'seq', width: 50, title: '序号' },
      { field: 'id', title: '消息ID', minWidth: 120 },
      { field: 'name', title: '消息名称', minWidth: 100 },
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

const [SignalGrid, signalGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { type: 'seq', width: 50, title: '序号' },
      { field: 'id', title: '信号ID', minWidth: 120 },
      { field: 'name', title: '信号名称', minWidth: 100 },
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

const [ModelModal, modelModalApi] = useVbenModal({
  destroyOnClose: true,
  onConfirm: addNewObject,
});

onMounted(() => {
  initDataList();
});

watch(
  messageList,
  (val) => {
    messageGridApi.setGridOptions({ data: val });
  },
  { deep: true },
);

watch(
  signalList,
  (val) => {
    signalGridApi.setGridOptions({ data: val });
  },
  { deep: true },
);
</script>
<template>
  <div class="-mx-2">
    <div class="mb-2 flex items-center justify-between">
      <span class="flex items-center">
        <IconifyIcon icon="ep:menu" class="mr-2 text-gray-600" />
        消息列表
      </span>
      <Button
        class="flex items-center"
        size="small"
        type="link"
        @click="openModel('message')"
      >
        <template #icon>
          <IconifyIcon icon="ep:plus" />
        </template>
        创建新消息
      </Button>
    </div>
    <MessageGrid :data="messageList">
      <template #action="{ row, rowIndex }">
        <Button
          size="small"
          type="link"
          @click="openEditModel('message', row, rowIndex)"
        >
          编辑
        </Button>
        <Divider type="vertical" />
        <Button
          size="small"
          type="link"
          danger
          @click="removeObject('message', row)"
        >
          移除
        </Button>
      </template>
    </MessageGrid>
    <div
      class="mb-2 mt-2 flex items-center justify-between border-t border-gray-200 pt-2"
    >
      <span class="flex items-center">
        <IconifyIcon icon="ep:menu" class="mr-2 text-gray-600" />
        信号列表
      </span>
      <Button
        class="flex items-center"
        size="small"
        type="link"
        @click="openModel('signal')"
      >
        <template #icon>
          <IconifyIcon icon="ep:plus" />
        </template>
        创建新信号
      </Button>
    </div>
    <SignalGrid :data="signalList">
      <template #action="{ row, rowIndex }">
        <Button
          size="small"
          type="link"
          @click="openEditModel('signal', row, rowIndex)"
        >
          编辑
        </Button>
        <Divider type="vertical" />
        <Button
          size="small"
          type="link"
          danger
          @click="removeObject('signal', row)"
        >
          移除
        </Button>
      </template>
    </SignalGrid>

    <ModelModal :title="modelConfig.title" class="w-3/5">
      <Form
        :model="modelObjectForm"
        ref="formRef"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 18 }"
      >
        <FormItem
          :label="modelConfig.idLabel"
          name="id"
          :rules="[{ required: true, message: '请输入 ID' }]"
        >
          <Input v-model:value="modelObjectForm.id" allow-clear />
        </FormItem>
        <FormItem :label="modelConfig.nameLabel">
          <Input v-model:value="modelObjectForm.name" allow-clear />
        </FormItem>
      </Form>
    </ModelModal>
  </div>
</template>
