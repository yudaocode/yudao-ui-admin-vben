<script lang="ts" setup>
import type { PayChannelApi } from '#/api/pay/channel';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { createChannel, getChannel, updateChannel } from '#/api/pay/channel';
import { CommonStatusEnum } from '#/utils';

import { channelSchema } from './data';

const emit = defineEmits(['success']);
const formData = ref<any>();
const formType = ref<string>('');
const title = computed(() => {
  return formData.value?.id === 0
    ? $t('ui.actionTitle.create', '应用')
    : $t('ui.actionTitle.edit', '应用');
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 160,
  },
  layout: 'horizontal',
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
    const data = (await formApi.getValues()) as PayChannelApi.Channel;
    // 只保留表单中实际存在的字段，且值不为 undefined
    const data2 = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => {
        // 检查字段是否在表单中存在，且值不为 undefined
        return key in data && value !== undefined;
      }),
    );
    const data3 = { ...formData.value, ...data2 };
    data3.config = JSON.stringify(data3.config);
    try {
      await (data3.id ? updateChannel(data3) : createChannel(data3));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const { id, payCode } = modalApi.getData() as {
      id?: number;
      payCode?: string;
    };
    if (!id || !payCode) {
      return;
    }
    modalApi.lock();
    formType.value = payCode;
    if (payCode.includes('alipay_')) {
      formData.value = {
        appId: id,
        code: payCode,
        status: CommonStatusEnum.ENABLE,
        remark: '',
        feeRate: null,
        config: {
          appId: '',
          serverUrl: null,
          signType: 'RSA2',
          mode: null,
          privateKey: '',
          alipayPublicKey: '',
          appCertContent: '',
          alipayPublicCertContent: '',
          rootCertContent: '',
          encryptType: '',
          encryptKey: '',
        },
      };
    } else if (payCode.includes('mock')) {
      formData.value = {
        appId: id,
        code: payCode,
        status: CommonStatusEnum.ENABLE,
        remark: '',
        feeRate: 0,
        config: {
          name: 'mock-conf',
        },
      };
    } else if (payCode.includes('wallet')) {
      formData.value = {
        appId: id,
        code: payCode,
        status: CommonStatusEnum.ENABLE,
        remark: '',
        feeRate: 0,
        config: {
          name: 'mock-conf',
        },
      };
    } else if (payCode.includes('wx')) {
      formData.value = {
        appId: id,
        code: payCode,
        status: CommonStatusEnum.ENABLE,
        feeRate: undefined,
        remark: '',
        config: {
          appId: '',
          mchId: '',
          apiVersion: '',
          mchKey: '',
          keyContent: '',
          privateKeyContent: '',
          certSerialNo: '',
          apiV3Key: '',
          publicKeyContent: '',
          publicKeyId: '',
        },
      };
    }

    try {
      const res = await getChannel(id, payCode);
      formData.value = {
        ...res,
        config: {
          ...JSON.parse(res.config),
        },
      };
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :close-on-click-modal="false" :title="title" class="w-2/5">
    <Form :schema="channelSchema(formType)" />
  </Modal>
</template>
