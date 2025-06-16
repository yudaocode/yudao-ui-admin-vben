<!-- 消息列表为空时，展示 prompt 列表 -->
<script setup lang="ts">
// prompt 列表

const emits = defineEmits(['onPrompt']);
const promptList = [
  {
    prompt: '今天气怎么样?',
  },
  {
    prompt: '写一首好听的诗歌?',
  },
]; /** 选中 prompt 点击 */
async function handlerPromptClick(prompt: any) {
  emits('onPrompt', prompt.prompt);
}
</script>
<template>
  <div class="relative flex h-full w-full flex-row justify-center">
    <!-- center-container -->
    <div class="flex flex-col justify-center">
      <!-- title -->
      <div class="text-center text-[28px] font-bold">芋道 AI</div>

      <!-- role-list -->
      <div
        class="mt-[20px] flex w-[460px] flex-wrap items-center justify-center"
      >
        <div
          v-for="prompt in promptList"
          :key="prompt.prompt"
          @click="handlerPromptClick(prompt)"
          class="m-[10px] flex w-[180px] cursor-pointer justify-center rounded-[10px] border border-[#e4e4e4] leading-[50px] hover:bg-[rgba(243,243,243,0.73)]"
        >
          {{ prompt.prompt }}
        </div>
      </div>
    </div>
  </div>
</template>
