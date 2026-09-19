<script lang="ts" setup>
import type { OaFileNodeApi } from '#/api/oa/file/node';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  copyFileNode,
  createFileNode,
  getFileDirectoryList,
  updateFileNodeName,
  updateFileNodeParent,
} from '#/api/oa/file/node';
import { $t } from '#/locales';
import {
  OA_FILE_NODE_TYPE,
  OA_FILE_PARENT_ID_ROOT,
} from '#/views/oa/utils/constants';

import { useNodeFormSchema } from '../data';

defineOptions({ name: 'OaFileNodeForm' });

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

interface DirectoryNode extends OaFileNodeApi.FileNode {
  children?: DirectoryNode[];
}

const formType = ref('create'); // 表单类型：create - 新建文件夹；rename - 重命名；move - 移动；copy - 复制
const parentId = ref(OA_FILE_PARENT_ID_ROOT); // 新建文件夹的目标目录
const directoryTree = ref<DirectoryNode[]>([]); // 可移动、复制到的目录树

const getTitle = computed(() => {
  if (formType.value === 'move') {
    return '移动';
  }
  if (formType.value === 'copy') {
    return '复制';
  }
  return formType.value === 'rename' ? '重命名' : '新建文件夹';
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  wrapperClass: 'grid-cols-1',
  layout: 'horizontal',
  schema: useNodeFormSchema(() => directoryTree.value),
  showDefaultActions: false,
});

/** 移除当前节点的整棵子树，避免移动、复制到自身及下级目录 */
function removeCurrentNode(
  nodes: DirectoryNode[],
  id?: number,
): DirectoryNode[] {
  return nodes
    .filter((item) => item.id !== id)
    .map((item) => ({
      ...item,
      children: item.children ? removeCurrentNode(item.children, id) : [],
    }));
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    // 1. 校验表单
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    // 2. 提交请求
    modalApi.lock();
    const values = await formApi.getValues();
    try {
      if (formType.value === 'create') {
        await createFileNode({
          name: values.name,
          parentId: parentId.value,
          type: OA_FILE_NODE_TYPE.FOLDER,
        });
        ElMessage.success($t('ui.actionMessage.operationSuccess'));
      } else if (formType.value === 'move') {
        await updateFileNodeParent(values.id, values.parentId);
        ElMessage.success('移动成功');
      } else if (formType.value === 'copy') {
        await copyFileNode(values.id, values.parentId);
        ElMessage.success('复制成功');
      } else {
        await updateFileNodeName(values.id, values.name);
        ElMessage.success('重命名成功');
      }
      // 3. 关闭并通知父组件刷新
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 1. 初始化表单数据
    const data = modalApi.getData() as {
      formType: string;
      parentId: number;
      row?: OaFileNodeApi.FileNode;
    };
    formType.value = data.formType;
    parentId.value = data.parentId;
    directoryTree.value = [];
    await formApi.setValues({
      id: data.row?.id,
      formType: data.formType,
      name: data.row?.name || '',
      parentId:
        data.formType === 'copy' ? OA_FILE_PARENT_ID_ROOT : data.parentId,
    });
    if (data.formType !== 'move' && data.formType !== 'copy') {
      return;
    }
    // 2. 加载目标目录，移除当前节点的整棵子树
    modalApi.lock();
    try {
      const list = await getFileDirectoryList();
      directoryTree.value = removeCurrentNode(
        [
          {
            id: OA_FILE_PARENT_ID_ROOT,
            name: '我的文件',
            parentId: OA_FILE_PARENT_ID_ROOT,
            type: OA_FILE_NODE_TYPE.FOLDER,
            children: handleTree(list) as DirectoryNode[],
          },
        ],
        data.row?.id,
      );
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[500px]">
    <Form class="mx-4" />
  </Modal>
</template>
