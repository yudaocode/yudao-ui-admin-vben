<script lang="ts" setup>
import type { HrmRecruitPostApi } from '#/api/hrm/recruit/post';

import { computed } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { Card } from 'antdv-next';

import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';

import { useHeaderSchema } from '../../data';

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    post: HrmRecruitPostApi.RecruitPost;
  }>(),
  {
    loading: false,
  },
);

const headerData = computed(() => props.post);

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
            post.postName || '-'
          }}</span>
          <DictTag
            v-if="post.status !== undefined && post.status !== null"
            :type="DICT_TYPE.HRM_RECRUIT_POST_STATUS"
            :value="post.status"
          />
        </div>
        <div class="text-muted-foreground mt-1.5 text-sm">
          职位编号：{{ post.id || '-' }}
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
