<script lang="ts" setup>
import type { HrmRecruitCandidateApi } from '#/api/hrm/recruit/candidate';

import { computed, ref } from 'vue';

import { ElCollapse, ElCollapseItem } from 'element-plus';

import { useDescription } from '#/components/description';

import { useCandidateInfoSchema, useRecruitInfoSchema } from '../data';

const props = defineProps<{
  candidate: HrmRecruitCandidateApi.RecruitCandidate;
}>();

const infoData = computed(() => props.candidate);
const activeKeys = ref(['candidateInfo', 'recruitInfo']);

const [CandidateDescriptions] = useDescription({
  border: false,
  column: 4,
  schema: useCandidateInfoSchema(),
});

const [RecruitDescriptions] = useDescription({
  border: false,
  column: 4,
  schema: useRecruitInfoSchema(),
});
</script>

<template>
  <ElCollapse v-model="activeKeys">
    <ElCollapseItem name="candidateInfo" title="候选人信息">
      <CandidateDescriptions :data="infoData" />
    </ElCollapseItem>
    <ElCollapseItem name="recruitInfo" title="招聘信息">
      <RecruitDescriptions :data="infoData" />
    </ElCollapseItem>
  </ElCollapse>
</template>
