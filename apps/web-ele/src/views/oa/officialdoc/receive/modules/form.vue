<script lang="ts" setup>
import type { OaOfficialDocReceiveApi } from '#/api/oa/officialdoc/receive';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';
import { formatDate } from '@vben/utils';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createOfficialDocReceive,
  getOfficialDocReceive,
  updateOfficialDocReceive,
} from '#/api/oa/officialdoc/receive';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const userStore = useUserStore(); // 当前用户

const formData = ref<OaOfficialDocReceiveApi.OfficialDocReceive>(); // 表单数据

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['公文收文'])
    : $t('ui.actionTitle.create', ['公文收文']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 110,
  },
  wrapperClass: 'grid-cols-2',
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
    // 提交表单，issueTimeText 仅用于展示关联发文日期，不参与提交
    const { issueTimeText: _issueTimeText, ...values } =
      await formApi.getValues();
    const data = {
      ...formData.value,
      ...values,
    } as OaOfficialDocReceiveApi.OfficialDocReceive;
    try {
      await (formData.value?.id
        ? updateOfficialDocReceive(data)
        : createOfficialDocReceive(data));
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
    const data = modalApi.getData() as null | { id?: number };
    if (!data?.id) {
      // 新增：填充业务默认值
      await formApi.setValues({
        receiveTime: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
        receiveDeptId: userStore.userInfo?.deptId,
        secrecyLevel: 0,
        urgencyLevel: 0,
        fileUrls: [],
        formalFileUrl: '',
      });
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getOfficialDocReceive(data.id);
      // 关联发文的发文日期仅按自然日展示，不回写原始值
      await formApi.setValues({
        ...formData.value,
        issueTimeText: formData.value.issueTime
          ? formatDate(formData.value.issueTime, 'YYYY-MM-DD')
          : '',
      });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/3">
    <Form class="mx-4" />
  </Modal>
</template>
