<script lang="ts" setup>
import type { HrmRecruitCandidateApi } from '#/api/hrm/recruit/candidate';

import { computed, ref } from 'vue';

import { Collapse, CollapsePanel } from 'antdv-next';

import { useDescription } from '#/components/description';

import { useCandidateInfoSchema, useRecruitInfoSchema } from '../data';

const props = defineProps<{
  candidate: HrmRecruitCandidateApi.RecruitCandidate;
}>();

const infoData = computed(() => props.candidate);
const activeKeys = ref(['candidateInfo', 'recruitInfo']);

const [CandidateDescriptions] = useDescription({
  bordered: false,
  column: 4,
  schema: useCandidateInfoSchema(),
});

const [RecruitDescriptions] = useDescription({
  bordered: false,
  column: 4,
  schema: useRecruitInfoSchema(),
});
</script>

<template>
  <Collapse v-model:active-key="activeKeys">
    <CollapsePanel key="candidateInfo" header="候选人信息">
      <CandidateDescriptions :data="infoData" />
    </CollapsePanel>
    <CollapsePanel key="recruitInfo" header="招聘信息">
      <RecruitDescriptions :data="infoData" />
    </CollapsePanel>
  </Collapse>
</template>
