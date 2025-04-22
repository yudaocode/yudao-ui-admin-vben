<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { Button } from 'ant-design-vue';

import { DocAlert } from '#/components/doc-alert';
</script>

<template>
  <Page>
    <DocAlert
      title="支付宝支付接入"
      url="https://doc.iocoder.cn/pay/alipay-pay-demo/"
    />
    <DocAlert
      title="支付宝、微信退款接入"
      url="https://doc.iocoder.cn/pay/refund-demo/"
    />
    <DocAlert
      title="微信公众号支付接入"
      url="https://doc.iocoder.cn/pay/wx-pub-pay-demo/"
    />
    <DocAlert
      title="微信小程序支付接入"
      url="https://doc.iocoder.cn/pay/wx-lite-pay-demo/"
    />
    <Button
      danger
      type="link"
      target="_blank"
      href="https://github.com/yudaocode/yudao-ui-admin-vue3"
    >
      该功能支持 Vue3 + element-plus 版本！
    </Button>
    <br />
    <Button
      type="link"
      target="_blank"
      href="https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/pay/demo/order/index"
    >
      可参考
      https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/pay/demo/order/index
      代码，pull request 贡献给我们！
    </Button>
  </Page>
</template>
