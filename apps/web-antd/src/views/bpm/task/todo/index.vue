<script lang="ts" setup>
import { DocAlert } from '#/components/doc-alert';
import { Button } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
</script>

<template>
  <Page>
    <DocAlert title="审批通过、不通过、驳回" url="https://doc.iocoder.cn/bpm/task-todo-done/" />
    <DocAlert title="审批加签、减签" url="https://doc.iocoder.cn/bpm/sign/" />
    <DocAlert title="审批转办、委派、抄送" url="https://doc.iocoder.cn/bpm/task-delegation-and-cc/" />
    <DocAlert title="审批加签、减签" url="https://doc.iocoder.cn/bpm/sign/" />
    <Button danger type="link" target="_blank" href="https://github.com/yudaocode/yudao-ui-admin-vue3">
      该功能支持 Vue3 + element-plus 版本！
    </Button>
    <br />
    <Button type="link" target="_blank" href="https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/bpm/task/todo/index">
      可参考 https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/bpm/task/todo/index 代码，pull request 贡献给我们！
    </Button>
  </Page>
</template>