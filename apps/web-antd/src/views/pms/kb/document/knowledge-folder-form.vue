<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createKnowledgeFolder,
  getKnowledgeFolder,
  updateKnowledgeFolder,
} from '#/api/pms/kb/content/folder';

import { useFolderFormSchema } from './data';

defineOptions({ name: 'PmsKnowledgeFolderForm' });

// TODO @AI：去掉 as any，API 类型对不上就补 VO。打开弹窗用 connectedComponent + setData，不要 defineExpose({ open })。
const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const formType = ref<'create' | 'update'>('create'); // 表单类型：create - 新增；update - 修改
const dialogTitle = computed(() =>
  formType.value === 'create' ? '新建文件夹' : '编辑文件夹',
); // 弹窗标题

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  wrapperClass: 'grid-cols-1',
  layout: 'horizontal',
  schema: useFolderFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[520px]',
  async onConfirm() {
    // 校验表单
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    // 提交请求
    modalApi.lock();
    try {
      const data = (await formApi.getValues()) as {
        id?: number;
        libraryId: number;
        parentId: number;
        title: string;
      };
      if (formType.value === 'create') {
        await createKnowledgeFolder(data as any);
        message.success('创建成功');
      } else {
        await updateKnowledgeFolder(data as any);
        message.success('更新成功');
      }
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
    const data = modalApi.getData() as {
      formType: 'create' | 'update';
      id?: number;
      libraryId: number;
      parentId: number;
    };
    formType.value = data.formType;
    // 重置表单并回填知识库与上级文件夹
    await formApi.setValues({
      id: undefined,
      libraryId: data.libraryId,
      parentId: data.parentId,
      title: '',
    });
    if (data.id) {
      modalApi.lock();
      try {
        const folder = await getKnowledgeFolder(data.id);
        // 回填编辑数据
        await formApi.setValues({
          id: folder.id,
          libraryId: folder.libraryId,
          parentId: folder.parentId,
          title: folder.title,
        });
      } finally {
        modalApi.unlock();
      }
    }
  },
});

/** 打开弹窗 */
defineExpose({
  open: (
    formType: 'create' | 'update',
    libraryId: number,
    parentId = 0,
    id?: number,
  ) => {
    modalApi.setData({ formType, libraryId, parentId, id }).open();
  },
});
</script>

<template>
  <Modal :title="dialogTitle">
    <Form class="mx-4" />
  </Modal>
</template>
