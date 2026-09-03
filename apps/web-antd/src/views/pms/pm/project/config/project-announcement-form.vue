<script lang="ts" setup>
import type { PmsProjectAnnouncementApi } from '#/api/pms/pm/project/announcement';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createProjectAnnouncement,
  getProjectAnnouncement,
  updateProjectAnnouncement,
} from '#/api/pms/pm/project/announcement';
import { $t } from '#/locales';

import { useAnnouncementFormSchema } from './data';

defineOptions({ name: 'PmsProjectAnnouncementForm' });

// TODO @AI：connectedComponent 补 destroyOnClose。标题对齐 system user 用 $t。

const emit = defineEmits<{ success: [] }>(); // 定义 success 事件，用于操作成功后的回调

const formType = ref<'create' | 'update'>('create'); // 表单的类型：create - 新增；update - 修改
const dialogTitle = computed(() =>
  formType.value === 'create'
    ? $t('ui.actionTitle.create', ['公告'])
    : $t('ui.actionTitle.edit', ['公告']),
); // 弹窗的标题

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useAnnouncementFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[680px]',
  async onConfirm() {
    // 校验表单
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    // 提交请求
    modalApi.lock();
    try {
      const data =
        (await formApi.getValues()) as PmsProjectAnnouncementApi.ProjectAnnouncement;
      if (formType.value === 'create') {
        await createProjectAnnouncement(data);
        message.success('创建成功');
      } else {
        await updateProjectAnnouncement(data);
        message.success('更新成功');
      }
      await modalApi.close();
      // 发送操作成功的事件
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
      projectId: number;
    };
    formType.value = data.formType;
    // 重置表单并回填项目编号
    await formApi.setValues({
      id: undefined,
      projectId: data.projectId,
      content: '',
      fileUrls: [],
    });
    // 修改时，查询公告详情
    if (data.id) {
      modalApi.lock();
      try {
        const announcement = await getProjectAnnouncement(data.id);
        await formApi.setValues({
          id: announcement.id,
          projectId: announcement.projectId,
          content: announcement.content,
          fileUrls: announcement.fileUrls ?? [],
        });
      } finally {
        modalApi.unlock();
      }
    }
  },
});
</script>

<template>
  <Modal :title="dialogTitle">
    <Form class="mx-4" />
  </Modal>
</template>
