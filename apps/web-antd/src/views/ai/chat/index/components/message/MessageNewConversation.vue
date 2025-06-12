<script setup lang="ts">
import { Button } from 'ant-design-vue';

const emits = defineEmits(['onNewConversation']);

/** 新建 conversation 聊天对话 */
const handlerNewChat = () => {
  emits('onNewConversation');
};
</script>

<template>
  <div class="new-chat">
    <div class="box-center">
      <div class="tip">点击下方按钮，开始你的对话吧</div>
      <div class="btns">
        <Button type="primary" round @click="handlerNewChat">新建对话</Button>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.new-chat {
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 100%;
  height: 100%;

  .box-center {
    display: flex;
    flex-direction: column;
    justify-content: center;

    .tip {
      font-size: 14px;
      color: #858585;
    }

    .btns {
      display: flex;
      flex-direction: row;
      justify-content: center;
      margin-top: 20px;
    }
  }
}
</style>
