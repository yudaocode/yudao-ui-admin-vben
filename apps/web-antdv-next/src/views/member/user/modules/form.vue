<script lang="ts" setup>
import type { MemberUserApi } from '#/api/member/user';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { getSimpleTagList } from '#/api/member/tag';
import { getUser, updateUser } from '#/api/member/user';
import { $t } from '#/locales';

import TagForm from '../../tag/modules/form.vue';
import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MemberUserApi.User>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['会员'])
    : $t('ui.actionTitle.create', ['会员']);
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

const [TagFormModal, tagFormModalApi] = useVbenModal({
  connectedComponent: TagForm,
  destroyOnClose: true,
});

/** 新增标签后刷新当前选择项 */
async function handleTagCreated() {
  const tags = await getSimpleTagList();
  await formApi.updateSchema([
    {
      fieldName: 'tagIds',
      component: 'Select',
      componentProps: {
        options: tags.map((tag) => ({
          label: tag.name,
          value: tag.id,
        })),
      },
    },
  ]);
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MemberUserApi.User;
    try {
      await updateUser(data);
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
    const data = modalApi.getData() as MemberUserApi.User;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getUser(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/2">
    <Form class="mx-4" />
    <div v-access:code="['member:tag:create']" class="mx-4 mb-4">
      <Button type="link" @click="tagFormModalApi.setData(null).open()">
        新增标签
      </Button>
    </div>
  </Modal>
  <TagFormModal @success="handleTagCreated" />
</template>
