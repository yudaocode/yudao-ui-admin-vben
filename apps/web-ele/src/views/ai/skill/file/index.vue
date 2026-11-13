<script lang="ts" setup>
import type { AiSkillApi } from '#/api/ai/skill';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { ElCard, ElMessage, ElTag } from 'element-plus';

import { getSkill } from '#/api/ai/skill';

import FileEditor from './modules/file-editor.vue';
import FileTree from './modules/file-tree.vue';

/** AI 技能文件管理 */
defineOptions({ name: 'AiSkillFile' });

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const skillId = Number(route.params.skillId) || undefined; // 技能编号
const skill = ref<AiSkillApi.Skill>(); // 技能信息
const selectedNode = ref<AiSkillApi.SkillFile>(); // 选中的节点

/** 选中节点 */
function handleSelect(node?: AiSkillApi.SkillFile) {
  selectedNode.value = node;
}

/** 返回列表页 */
async function handleBack() {
  // 关闭当前页签
  await tabs.closeCurrentTab();
  // 跳转到列表页
  await router.push({ path: '/ai/console/skill' });
}

/** 初始化 */
onMounted(async () => {
  if (!skillId) {
    ElMessage.warning('参数错误，技能不能为空！');
    await handleBack();
    return;
  }
  skill.value = await getSkill(skillId);
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-2">
      <!-- 头部 -->
      <ElCard shadow="never" :body-style="{ padding: '12px 16px' }">
        <div class="flex flex-wrap items-center gap-3">
          <IconifyIcon
            icon="lucide:arrow-left"
            class="size-5 flex-shrink-0 cursor-pointer"
            @click="handleBack"
          />
          <span class="text-base font-semibold">文件管理</span>
          <span class="text-sm text-muted-foreground">
            技能：{{ skill?.name || '-' }}
          </span>
          <ElTag type="info">
            仅 SKILL.md 与 scripts/、reference/ 固定，其余可自由扩展
          </ElTag>
        </div>
      </ElCard>
      <!-- 文件树 + 编辑器 -->
      <ElCard
        shadow="never"
        class="min-h-0 flex-1"
        :body-style="{ height: '100%', padding: '12px' }"
      >
        <div v-if="skillId" class="flex h-full items-stretch gap-3">
          <FileTree :skill-id="skillId" @select="handleSelect" />
          <FileEditor :file="selectedNode" />
        </div>
      </ElCard>
    </div>
  </Page>
</template>
