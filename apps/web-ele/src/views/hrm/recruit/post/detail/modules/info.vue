<script lang="ts" setup>
import type { HrmRecruitPostApi } from '#/api/hrm/recruit/post';

import { computed, ref } from 'vue';

import { ElCollapse, ElCollapseItem } from 'element-plus';

import { useDescription } from '#/components/description';

import { useBasicInfoSchema } from '../../data';

const props = defineProps<{
  post: HrmRecruitPostApi.RecruitPost;
}>();

const infoData = computed(() => props.post);
const activeKeys = ref(['basicInfo', 'description']);

const [BasicDescriptions] = useDescription({
  border: false,
  column: 4,
  schema: useBasicInfoSchema(),
});
</script>

<template>
  <ElCollapse v-model="activeKeys">
    <ElCollapseItem name="basicInfo" title="基本信息">
      <BasicDescriptions :data="infoData" />
    </ElCollapseItem>
    <ElCollapseItem name="description" title="职位描述">
      <div class="min-h-8 whitespace-pre-wrap break-words">
        {{ post.description || '-' }}
      </div>
    </ElCollapseItem>
  </ElCollapse>
</template>
