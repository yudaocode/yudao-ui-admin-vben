<script lang="ts" setup>
import { ref } from 'vue';

import { ElTag } from 'element-plus';

const props = defineProps<{
  item: any;
}>();

// TODO @hw：看看用 antd 的风格，还是 ele 的风格，就是下面的 item。
const item = ref(props.item);
</script>

<template>
  <div>
    <div v-if="item.event === 'subscribe'">
      <ElTag type="success">关注</ElTag>
    </div>
    <div v-else-if="item.event === 'unsubscribe'">
      <ElTag type="danger">取消关注</ElTag>
    </div>
    <div v-else-if="item.event === 'CLICK'">
      <ElTag>点击菜单</ElTag>
      【{{ item.eventKey }}】
    </div>
    <div v-else-if="item.event === 'VIEW'">
      <ElTag>点击菜单链接</ElTag>
      【{{ item.eventKey }}】
    </div>
    <div v-else-if="item.event === 'scancode_waitmsg'">
      <ElTag>扫码结果</ElTag>
      【{{ item.eventKey }}】
    </div>
    <div v-else-if="item.event === 'scancode_push'">
      <ElTag>扫码结果</ElTag>
      【{{ item.eventKey }}】
    </div>
    <div v-else-if="item.event === 'pic_sysphoto'">
      <ElTag>系统拍照发图</ElTag>
    </div>
    <div v-else-if="item.event === 'pic_photo_or_album'">
      <ElTag>拍照或者相册</ElTag>
    </div>
    <div v-else-if="item.event === 'pic_weixin'">
      <ElTag>微信相册</ElTag>
    </div>
    <div v-else-if="item.event === 'location_select'">
      <ElTag>选择地理位置</ElTag>
    </div>
    <div v-else-if="item.event === 'SCAN'">
      <ElTag>扫码</ElTag>
    </div>
    <div v-else>
      <ElTag type="danger">未知事件类型</ElTag>
    </div>
  </div>
</template>
