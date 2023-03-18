<template>
  <div class="step3">
    <Result status="success" title="操作成功" sub-title="预计两小时内到账">
      <template #extra>
        <a-button type="primary" @click="redo"> 再转一笔 </a-button>
        <a-button> 查看账单 </a-button>
      </template>
    </Result>
    <div class="desc-wrap">
      <Descriptions :column="1" class="mt-5">
        <DescriptionItem label="付款账户"> ant-design@alipay.com </DescriptionItem>
        <DescriptionItem label="收款账户"> test@example.com </DescriptionItem>
        <DescriptionItem label="收款人姓名"> Vben </DescriptionItem>
        <DescriptionItem label="转账金额"> 500元 </DescriptionItem>
      </Descriptions>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { Result, Descriptions } from 'ant-design-vue'
const DescriptionItem = Descriptions.Item
const emit = defineEmits(['redo'])
function redo() {
  emit('redo')
}
</script>
<style lang="less" scoped>
.step3 {
  width: 600px;
  margin: 0 auto;
}

.desc-wrap {
  padding: 24px 40px;
  margin-top: 24px;
  background-color: @background-color-light;
}
</style>
