<script setup lang="ts">
import { reactive, ref } from 'vue';

import { Button, Textarea } from 'ant-design-vue';

import { MindMapContentExample } from '#/utils/constants';

defineProps<{
  isGenerating: boolean;
}>();
const emits = defineEmits(['submit', 'directGenerate']);
const formData = reactive({
  prompt: '',
});

const generatedContent = ref(MindMapContentExample); // 已有的内容

defineExpose({
  setGeneratedContent(newContent: string) {
    // 设置已有的内容，在生成结束的时候将结果赋值给该值
    generatedContent.value = newContent;
  },
});
</script>
<template>
  <div class="flex w-[350px] flex-col bg-[#f5f7f9] p-5">
    <h3 class="title w-full text-center leading-[28px]">思维导图创作中心</h3>
    <div class="flex-grow overflow-y-auto">
      <div>
        <b>您的需求？</b>
        <Textarea
          v-model:value="formData.prompt"
          :maxlength="1024"
          :rows="8"
          class="w-100% mt-15px"
          placeholder="请输入提示词，让AI帮你完善"
          show-count
        />
        <Button
          class="mt-[15px] !w-full"
          type="primary"
          :loading="isGenerating"
          @click="emits('submit', formData)"
        >
          智能生成思维导图
        </Button>
      </div>
      <div class="mt-[30px]">
        <b>使用已有内容生成？</b>
        <Textarea
          v-model:value="generatedContent"
          :maxlength="1024"
          :rows="8"
          class="w-100% mt-15px"
          placeholder="例如：童话里的小屋应该是什么样子？"
          show-count
        />
        <Button
          class="mt-[15px] !w-full"
          type="primary"
          @click="emits('directGenerate', generatedContent)"
          :disabled="isGenerating"
        >
          直接生成
        </Button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title {
  height: 1.75rem;
  font-size: 1.25rem;
  color: hsl(var(--primary));
}
</style>
