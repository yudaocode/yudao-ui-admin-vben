<script lang="ts" setup>
import { DocAlert, Page } from '@vben/common-ui';

import { ElButton } from 'element-plus';
</script>

<template>
  <Page>
    <DocAlert
      title="【统计】会员、商品、交易统计"
      url="https://doc.iocoder.cn/mall/statistics/"
    />
    <ElButton
      danger
      type="primary"
      link
      target="_blank"
      href="https://github.com/yudaocode/yudao-ui-admin-vue3"
    >
      该功能支持 Vue3 + element-plus 版本！
    </ElButton>
    <br />
    <ElButton
      type="primary"
      link
      target="_blank"
      href="https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/mall/statistics/trade/index"
    >
      可参考
      https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/mall/statistics/trade/index
      代码，pull request 贡献给我们！
    </ElButton>
  </Page>
</template>
