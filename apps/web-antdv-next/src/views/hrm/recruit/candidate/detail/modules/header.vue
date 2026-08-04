<script lang="ts" setup>
import type { HrmRecruitCandidateApi } from '#/api/hrm/recruit/candidate';

import { computed } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { Card } from 'antdv-next';

import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';

import { useHeaderSchema } from '../data';

const props = withDefaults(
  defineProps<{
    candidate: HrmRecruitCandidateApi.RecruitCandidate;
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const headerData = computed(() => props.candidate);

const [Descriptions] = useDescription({
  bordered: false,
  column: 5,
  layout: 'vertical',
  schema: useHeaderSchema(),
});
</script>

<template>
  <div>
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2.5">
          <span class="break-all text-xl font-bold">{{
            candidate.name || '-'
          }}</span>
          <DictTag
            v-if="candidate.status !== undefined && candidate.status !== null"
            :type="DICT_TYPE.HRM_RECRUIT_CANDIDATE_STATUS"
            :value="candidate.status"
          />
        </div>
        <div class="text-muted-foreground mt-1.5 text-sm">
          候选人编号：{{ candidate.id || '-' }}
        </div>
      </div>
      <div>
        <slot></slot>
      </div>
    </div>
    <Card class="mt-2.5" :loading="loading">
      <Descriptions :data="headerData" />
    </Card>
  </div>
</template>
