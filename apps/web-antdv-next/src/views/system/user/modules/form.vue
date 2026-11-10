<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { getSimplePostList } from '#/api/system/post';
import { createUser, getUser, updateUser } from '#/api/system/user';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemUserApi.User>();

/** 岗位下拉只含启用岗位；用户身上已删除或停用的岗位若原样提交，后端会回「当前岗位不存在」。 */
async function dropMissingPosts(user: SystemUserApi.User) {
  const posts = await getSimplePostList();
  const validIds = new Set(
    posts.flatMap((post) => (post.id == null ? [] : [Number(post.id)])),
  );
  const postIds = Array.isArray(user.postIds) ? user.postIds : [];
  const kept = postIds.filter((id) => validIds.has(Number(id)));
  if (kept.length === postIds.length) {
    return;
  }
  user.postIds = kept;
  message.warning('已去掉不存在或已停用的岗位，请确认后保存');
}

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['用户'])
    : $t('ui.actionTitle.create', ['用户']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as SystemUserApi.User;
    if (data.mobile === '') {
      data.mobile = undefined;
    }
    try {
      await (formData.value?.id ? updateUser(data) : createUser(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as SystemUserApi.User;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      const user = await getUser(data.id);
      await dropMissingPosts(user);
      formData.value = user;
      // 设置到 values
      await formApi.setValues(user);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/3">
    <Form class="mx-4" />
  </Modal>
</template>
