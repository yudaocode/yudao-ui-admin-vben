<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { Button } from 'ant-design-vue';

import { DocAlert } from '#/components/doc-alert';
</script>

<template>
  <Page>
    <DocAlert
      title="【营销】拼团活动"
      url="https://doc.iocoder.cn/mall/promotion-combination/"
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
      href="https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/mall/promotion/combination/record/index.vue"
    >
      可参考
      https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/mall/promotion/combination/record/index.vue
      代码，pull request 贡献给我们！
    </Button>
  </Page>
</template>
