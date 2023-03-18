<template>
  <Card hoverable :style="{ width: '240px', background: '#fff' }">
    <template #cover>
      <img alt="example" src="https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png" />
    </template>
    <CardMeta title="懒加载组件" />
  </Card>
</template>
<script lang="ts" setup>
import { Card } from 'ant-design-vue'
const CardMeta = Card.Meta
</script>
