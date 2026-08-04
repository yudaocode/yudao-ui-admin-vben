<script lang="ts" setup>
import type { HrmRecruitPostApi } from '#/api/hrm/recruit/post';

import { computed, ref } from 'vue';

import { Collapse } from 'ant-design-vue';

import { useDescription } from '#/components/description';

import { useBasicInfoSchema } from '../../data';

const props = defineProps<{
  post: HrmRecruitPostApi.RecruitPost;
}>();

const infoData = computed(() => props.post);
const activeKeys = ref(['basicInfo', 'description']);

const [BasicDescriptions] = useDescription({
  bordered: false,
  column: 4,
  schema: useBasicInfoSchema(),
});
</script>

<template>
  <Collapse v-model:active-key="activeKeys">
    <Collapse.Panel key="basicInfo" header="基本信息">
      <BasicDescriptions :data="infoData" />
    </Collapse.Panel>
    <Collapse.Panel key="description" header="职位描述">
      <div class="min-h-8 whitespace-pre-wrap break-words">
        {{ post.description || '-' }}
      </div>
    </Collapse.Panel>
  </Collapse>
</template>
