<script lang="ts" setup>
import type { AiSkillApi } from '#/api/ai/skill';

import { computed, ref, watch } from 'vue';

import { AiSkillFileTypeEnum } from '@vben/constants';

import {
  ElButton,
  ElEmpty,
  ElInput,
  ElMessage,
  ElRadioButton,
  ElRadioGroup,
  ElTag,
} from 'element-plus';

import { getSkillFile, updateSkillFileContent } from '#/api/ai/skill';
import { MarkdownView } from '#/components/markdown-view';
import { $t } from '#/locales';

/** AI 技能文件编辑器 */
defineOptions({ name: 'AiSkillFileEditor' });

const props = defineProps<{
  file?: AiSkillApi.SkillFile; // 选中的节点
}>();

const loading = ref(false); // 内容的加载中
const saving = ref(false); // 保存的加载中
const content = ref(''); // 编辑器内容
const editorMode = ref<'edit' | 'preview'>('edit'); // 编辑模式：edit - 编辑；preview - 预览

/** 是否为 Markdown 文件 */
const isMarkdown = computed(() => props.file?.fileType === 'md');

/** 预览中改名为非 Markdown 文件时，回到编辑模式，避免编辑区被隐藏 */
watch(isMarkdown, (value) => {
  if (!value) {
    editorMode.value = 'edit';
  }
});

/** 加载文件内容 */
async function loadContent(id: number) {
  loading.value = true;
  try {
    const data = await getSkillFile(id);
    if (props.file?.id === id) {
      content.value = data.content ?? '';
    }
  } finally {
    loading.value = false;
  }
}

/** 监听选中节点，切换文件时加载内容 */
watch(
  () => props.file?.id,
  (id) => {
    editorMode.value = 'edit';
    content.value = '';
    if (id && props.file?.type === AiSkillFileTypeEnum.FILE) {
      loadContent(id);
    }
  },
  { immediate: true },
);

/** 保存文件内容 */
async function handleSave() {
  if (!props.file) {
    return;
  }
  saving.value = true;
  try {
    await updateSkillFileContent({
      id: props.file.id,
      content: content.value,
    });
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div
    class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-border"
  >
    <!-- 未选中 -->
    <div v-if="!file" class="flex flex-1 items-center justify-center">
      <ElEmpty description="请选择左侧文件进行编辑" />
    </div>
    <!-- 选中目录 -->
    <div
      v-else-if="file.type === AiSkillFileTypeEnum.DIRECTORY"
      class="flex flex-1 items-center justify-center"
    >
      <ElEmpty :description="`目录[${file.name}]下可新建文件或子目录`" />
    </div>
    <!-- 选中文件 -->
    <template v-else>
      <div
        class="flex items-center justify-between border-b border-border px-3 py-2"
      >
        <span class="flex min-w-0 items-center gap-2 font-semibold">
          <span class="truncate" :title="file.name">{{ file.name }}</span>
          <ElTag v-if="file.fileType">{{ file.fileType }}</ElTag>
          <ElTag v-if="file.locked" type="warning">固定</ElTag>
        </span>
        <div class="flex flex-shrink-0 items-center gap-3">
          <ElRadioGroup v-if="isMarkdown" v-model="editorMode" size="small">
            <ElRadioButton value="edit">编辑</ElRadioButton>
            <ElRadioButton value="preview">预览</ElRadioButton>
          </ElRadioGroup>
          <ElButton
            v-access:code="['ai:skill:update']"
            type="primary"
            :loading="saving"
            @click="handleSave"
          >
            保存内容
          </ElButton>
        </div>
      </div>
      <div v-loading="loading" class="relative min-h-0 flex-1">
        <div v-show="editorMode === 'edit'" class="h-full p-2.5">
          <ElInput
            v-model="content"
            type="textarea"
            resize="none"
            class="skill-file-editor h-full font-mono text-[13px]"
            spellcheck="false"
          />
        </div>
        <!-- Markdown 预览 -->
        <div
          v-if="editorMode === 'preview'"
          class="h-full overflow-auto px-4 py-3"
        >
          <MarkdownView :content="content" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.skill-file-editor :deep(.el-textarea__inner) {
  height: 100%;
  line-height: 1.625;
}
</style>
