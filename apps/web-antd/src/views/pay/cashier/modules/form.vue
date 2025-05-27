<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Input, message, QRCode } from 'ant-design-vue';

import { submitOrder } from '#/api/pay/order';
import {
  PayChannelEnum,
  PayDisplayModeEnum,
  PayOrderStatusEnum,
} from '#/utils';

const emit = defineEmits(['success']);
const title = ref('支付订单');
const channelCode = ref('');
const formData = ref();

/** 展示形式：二维码 */
const qrCode = ref({
  url: '',
  visible: false,
});

/** 展示形式：条形码 */
const barCode = ref({
  channelCode: '',
  value: '',
  visible: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    modalApi.lock();
    try {
      const submitParam = {
        id: formData.value.id,
        channelCode: formData.value.channelCode,
        returnUrl: formData.value.returnUrl, // 支付成功后，支付渠道跳转回当前页；再由当前页，跳转回 {@link returnUrl} 对应的地址
        ...buildSubmitParam(formData.value.channelCode),
      };
      const data = await submitOrder(submitParam);
      // 直接返回已支付的情况，例如说扫码支付
      if (data.status === PayOrderStatusEnum.SUCCESS.status) {
        message.success('支付成功！');
        emit('success');
      }
      // 展示对应的界面
      switch (data.displayMode) {
        case PayDisplayModeEnum.APP.mode: {
          await modalApi.close();
          emit('success', { channelCode });
          break;
        }
        case PayDisplayModeEnum.QR_CODE.mode: {
          await modalApi.close();
          emit('success', { channelCode, data });
          break;
        }
        case PayDisplayModeEnum.URL.mode: {
          await modalApi.close();
          emit('success', { channelCode, data });
          break;
        }
        // No default
      }
    } catch (error) {
      message.error(error as string);
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
    const data = modalApi.getData();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    formData.value = data;
    try {
      channelCode.value = formData.value.channelCode;
      // 条形码支付，需要特殊处理
      if (formData.value.channelCode === PayChannelEnum.ALIPAY_BAR.code) {
        title.value = '“支付宝”条码支付';
        barCode.value = {
          channelCode: formData.value.channelCode,
          value: formData.value.channelExtras.auth_code,
          visible: true,
        };
      } else if (formData.value.channelCode === PayChannelEnum.WX_BAR.code) {
        title.value = '“微信”条码支付';
        barCode.value = {
          channelCode: formData.value.channelCode,
          value: formData.value.channelExtras.authCode,
          visible: true,
        };
      }
    } finally {
      modalApi.unlock();
    }
  },
});

/** 构建提交支付的额外参数 */
function buildSubmitParam(channelCode: string) {
  // ① 支付宝 BarCode 支付时，需要传递 authCode 条形码
  if (channelCode === PayChannelEnum.ALIPAY_BAR.code) {
    return {
      channelExtras: {
        auth_code: barCode.value.value,
      },
    };
  }
  // ② 微信 BarCode 支付时，需要传递 authCode 条形码
  if (channelCode === PayChannelEnum.WX_BAR.code) {
    return {
      channelExtras: {
        authCode: barCode.value.value,
      },
    };
  }
  return {};
}

</script>

<template>
  <Modal class="w-[600px]" :title="title">
    <QRCode v-if="qrCode.visible" :value="qrCode.url" />
    <Input
      v-if="barCode.visible"
      v-model:value="barCode.value"
      placeholder="请输入条形码"
      required
    />
    <div style="text-align: right" v-if="barCode.visible">
      或使用
      <Button
        type="link"
        danger
        target="_blank"
        href="https://baike.baidu.com/item/条码支付/10711903"
      >
        (扫码枪/扫码盒)
      </Button>
      扫码
    </div>
  </Modal>
</template>
