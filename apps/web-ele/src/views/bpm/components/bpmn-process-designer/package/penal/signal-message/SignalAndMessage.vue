<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { ElButton, ElDivider, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import SignalMessageModal from './SignalMessageModal.vue';

defineOptions({ name: 'SignalAndMassage' });
const signalList = ref<any[]>([]);
const messageList = ref<any[]>([]);
const modelType = ref<'message' | 'signal'>('message');
const rootElements = ref();
const messageIdMap = ref();
const signalIdMap = ref();
const editingIndex = ref(-1); // 正在编辑的索引，-1 表示新建
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

const openModel = (type: 'message' | 'signal') => {
  modelType.value = type;
  editingIndex.value = -1;
  modalApi
    .setData({
      id: generateStandardId(type),
      isEdit: false,
      name: '',
      type,
    })
    .open();
};

const openEditModel = (type: 'message' | 'signal', row: any, index: number) => {
  modelType.value = type;
  editingIndex.value = index;
  modalApi
    .setData({
      id: row.id,
      isEdit: true,
      name: row.name,
      type,
    })
    .open();
};

const handleConfirm = (formData: { id: string; name: string }) => {
  if (modelType.value === 'message') {
    if (editingIndex.value === -1) {
      // 新建模式
      if (messageIdMap.value[formData.id]) {
        ElMessage.error('该消息已存在，请修改id后重新保存');
        return;
      }
      const messageRef = bpmnInstances().moddle.create(
        'bpmn:Message',
        formData,
      );
      rootElements.value.push(messageRef);
    } else {
      // 编辑模式
      const targetMessage = messageList.value[editingIndex.value];
      const rootMessage = rootElements.value.find(
        (el: any) => el.$type === 'bpmn:Message' && el.id === targetMessage.id,
      );
      if (rootMessage) {
        rootMessage.id = formData.id;
        rootMessage.name = formData.name;
      }
    }
  } else {
    if (editingIndex.value === -1) {
      // 新建模式
      if (signalIdMap.value[formData.id]) {
        ElMessage.error('该信号已存在，请修改id后重新保存');
        return;
      }
      const signalRef = bpmnInstances().moddle.create('bpmn:Signal', formData);
      rootElements.value.push(signalRef);
    } else {
      // 编辑模式
      const targetSignal = signalList.value[editingIndex.value];
      const rootSignal = rootElements.value.find(
        (el: any) => el.$type === 'bpmn:Signal' && el.id === targetSignal.id,
      );
      if (rootSignal) {
        rootSignal.id = formData.id;
        rootSignal.name = formData.name;
      }
    }
  }
  // 触发建模器更新以保存更改
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
    ElMessage.success('移除成功');
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

const [Modal, modalApi] = useVbenModal({
  connectedComponent: SignalMessageModal,
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
      <ElButton
        class="flex items-center"
        size="small"
        type="primary"
        link
        @click="openModel('message')"
      >
        <template #icon>
          <IconifyIcon icon="ep:plus" />
        </template>
        创建新消息
      </ElButton>
    </div>
    <MessageGrid :data="messageList">
      <template #action="{ row, rowIndex }">
        <ElButton
          size="small"
          type="primary"
          link
          @click="openEditModel('message', row, rowIndex)"
        >
          编辑
        </ElButton>
        <ElDivider direction="vertical" />
        <ElButton
          size="small"
          type="danger"
          link
          @click="removeObject('message', row)"
        >
          移除
        </ElButton>
      </template>
    </MessageGrid>
    <div
      class="mb-2 mt-2 flex items-center justify-between border-t border-gray-200 pt-2"
    >
      <span class="flex items-center">
        <IconifyIcon icon="ep:menu" class="mr-2 text-gray-600" />
        信号列表
      </span>
      <ElButton
        class="flex items-center"
        size="small"
        type="primary"
        link
        @click="openModel('signal')"
      >
        <template #icon>
          <IconifyIcon icon="ep:plus" />
        </template>
        创建新信号
      </ElButton>
    </div>
    <SignalGrid :data="signalList">
      <template #action="{ row, rowIndex }">
        <ElButton
          size="small"
          type="primary"
          link
          @click="openEditModel('signal', row, rowIndex)"
        >
          编辑
        </ElButton>
        <ElDivider direction="vertical" />
        <ElButton
          size="small"
          type="danger"
          link
          @click="removeObject('signal', row)"
        >
          移除
        </ElButton>
      </template>
    </SignalGrid>

    <Modal @confirm="handleConfirm" />
  </div>
</template>
