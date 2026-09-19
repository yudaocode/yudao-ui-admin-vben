<script lang="ts" setup>
import type { OaContactApi } from '#/api/oa/contact';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { handleContactShare } from '#/api/oa/contact';
import { getSimpleContactCategoryList } from '#/api/oa/contact/category';
import { $t } from '#/locales';

import { useHandleFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaContactApi.Contact>(); // 处理的共享联系人
const getTitle = computed(() =>
  formData.value?.handleStatus ? '移动联系人分类' : '处理共享联系人',
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: useHandleFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid || !formData.value?.id) {
      return;
    }
    modalApi.lock();
    // 提交共享处理请求
    const { categoryId } = await formApi.getValues();
    try {
      await handleContactShare(formData.value.id, categoryId);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
    const data = modalApi.getData() as OaContactApi.Contact;
    if (!data?.id) {
      return;
    }
    formData.value = data;
    modalApi.lock();
    try {
      // 加载分类选项并回显当前归入的分类
      const categories = await getSimpleContactCategoryList();
      formApi.updateSchema([
        {
          fieldName: 'categoryId',
          componentProps: {
            options: categories.map((item) => ({
              label: item.name,
              value: item.id,
            })),
          },
        },
      ]);
      await formApi.setValues({ categoryId: data.sharedCategoryId });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[480px]">
    <Form class="mx-4" />
  </Modal>
</template>
