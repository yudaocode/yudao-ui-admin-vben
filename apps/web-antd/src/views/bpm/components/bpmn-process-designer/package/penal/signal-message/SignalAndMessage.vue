<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Divider,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Table,
  TableColumn,
} from 'ant-design-vue';

defineOptions({ name: 'SignalAndMassage' });
const signalList = ref<any[]>([]);
const messageList = ref<any[]>([]);
const dialogVisible = ref(false);
const modelType = ref('');
const modelObjectForm = ref<any>({});
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
  // console.log(window, 'window');
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
  dialogVisible.value = true;
};

const openEditModel = (type: any, row: any, index: number) => {
  modelType.value = type;
  editingIndex.value = index;
  modelObjectForm.value = { ...row };
  dialogVisible.value = true;
};

const addNewObject = () => {
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
  dialogVisible.value = false;
  initDataList();
};

// 补充"编辑"、"移除"功能。相关 issue：https://github.com/YunaiV/yudao-cloud/issues/270
const removeObject = (type: any, row: any) => {
  Modal.confirm({
    title: '提示',
    content: `确认移除该${type === 'message' ? '消息' : '信号'}吗？`,
    okText: '确 认',
    cancelText: '取 消',
    onOk() {
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
    },
    onCancel() {
      // console.info('操作取消');
    },
  });
};

onMounted(() => {
  initDataList();
});
</script>
<template>
  <div class="panel-tab__content">
    <div class="panel-tab__content--title">
      <span class="flex items-center">
        <IconifyIcon icon="ep:menu" class="mr-2 text-gray-600" />
        消息列表
      </span>
      <Button type="primary" title="创建新消息" @click="openModel('message')">
        <template #icon>
          <IconifyIcon icon="ep:plus" />
        </template>
        创建新消息
      </Button>
    </div>
    <Table :data-source="messageList" size="small" bordered>
      <TableColumn title="序号" width="60px">
        <template #default="{ index }">
          {{ index + 1 }}
        </template>
      </TableColumn>
      <TableColumn title="消息ID" data-index="id" />
      <TableColumn title="消息名称" data-index="name" />
      <TableColumn title="操作" width="110px">
        <template #default="{ record, index }">
          <Button
            size="small"
            type="link"
            @click="openEditModel('message', record, index)"
          >
            编辑
          </Button>
          <Divider type="vertical" />
          <Button
            size="small"
            type="link"
            danger
            @click="removeObject('message', record)"
          >
            移除
          </Button>
        </template>
      </TableColumn>
    </Table>
    <div class="panel-tab__content--title mt-2 border-t border-gray-200 pt-2">
      <span class="flex items-center">
        <IconifyIcon icon="ep:menu" class="mr-2 text-gray-600" />
        信号列表
      </span>
      <Button type="primary" title="创建新信号" @click="openModel('signal')">
        <template #icon>
          <IconifyIcon icon="ep:plus" />
        </template>
        创建新信号
      </Button>
    </div>
    <Table :data-source="signalList" size="small" bordered>
      <TableColumn title="序号" width="60px">
        <template #default="{ index }">
          {{ index + 1 }}
        </template>
      </TableColumn>
      <TableColumn title="信号ID" data-index="id" />
      <TableColumn title="信号名称" data-index="name" />
      <TableColumn title="操作" width="110px">
        <template #default="{ record, index }">
          <Button
            size="small"
            type="link"
            @click="openEditModel('signal', record, index)"
          >
            编辑
          </Button>
          <Divider type="vertical" />
          <Button
            size="small"
            type="link"
            danger
            @click="removeObject('signal', record)"
          >
            移除
          </Button>
        </template>
      </TableColumn>
    </Table>

    <Modal
      v-model:open="dialogVisible"
      :title="modelConfig.title"
      :mask-closable="false"
      width="400px"
      :destroy-on-close="true"
    >
      <Form :model="modelObjectForm">
        <FormItem :label="modelConfig.idLabel">
          <Input v-model:value="modelObjectForm.id" allow-clear />
        </FormItem>
        <FormItem :label="modelConfig.nameLabel">
          <Input v-model:value="modelObjectForm.name" allow-clear />
        </FormItem>
      </Form>
      <template #footer>
        <Button @click="dialogVisible = false">取 消</Button>
        <Button type="primary" @click="addNewObject">保 存</Button>
      </template>
    </Modal>
  </div>
</template>
