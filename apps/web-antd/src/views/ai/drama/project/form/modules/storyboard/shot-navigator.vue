<script lang="ts" setup>
import type { AiDramaAssetApi } from '#/api/ai/drama/asset';
import type { AiDramaStoryboardApi } from '#/api/ai/drama/storyboard';

import { computed, ref } from 'vue';

import { AiDramaStatusEnum, DICT_TYPE } from '@vben/constants';

import { Select } from 'ant-design-vue';

import { DictTag } from '#/components/dict-tag';

/** AI 短剧：镜头导航，按原文场次分组；点击直接切换镜头 */
defineOptions({ name: 'AiDramaShotNavigator' });

const props = defineProps<{
  locations: AiDramaAssetApi.Location[];
  modelValue?: number; // 选中的镜头编号
  storyboards: AiDramaStoryboardApi.Storyboard[];
}>();
const emit = defineEmits<{ 'update:modelValue': [id: number] }>();

const sceneFilter = ref<string>(); // 场次筛选

const successCount = computed(
  () =>
    props.storyboards.filter(
      (item) => item.videoStatus === AiDramaStatusEnum.SUCCESS && item.videoUrl,
    ).length,
);

/**
 * 按原文场次分组：取规划时记录的场次（连续性设置的 sceneNumber），按镜头顺序连续归组；
 * 没有场次的镜头（手动新增、旧数据）归入「未分场」
 */
const groups = computed(() => {
  const result: {
    items: AiDramaStoryboardApi.Storyboard[];
    key: string;
    label: string;
  }[] = [];
  props.storyboards.forEach((item) => {
    const sceneNumber = item.continuity?.sceneNumber;
    const key = sceneNumber ? `scene-${sceneNumber}` : 'none';
    let group = result.find((group) => group.key === key);
    if (!group) {
      const location = props.locations.find(
        (location) => location.id === item.locationId,
      );
      const label = sceneNumber
        ? `场 ${sceneNumber}${location ? ` · ${location.name}` : ''}`
        : '未分场';
      group = { key, label, items: [] };
      result.push(group);
    }
    group.items.push(item);
  });
  return result;
});
const visibleGroups = computed(() =>
  sceneFilter.value
    ? groups.value.filter((group) => group.key === sceneFilter.value)
    : groups.value,
);
const groupOptions = computed(() =>
  groups.value.map((group) => ({ label: group.label, value: group.key })),
);
</script>

<template>
  <div class="flex flex-col gap-2">
    <Select
      v-model:value="sceneFilter"
      :options="groupOptions"
      allow-clear
      placeholder="全部场次"
      size="small"
    />
    <div class="text-muted-foreground text-xs">
      视频已完成 {{ successCount }} / {{ storyboards.length }}
    </div>
    <div v-for="group in visibleGroups" :key="group.key">
      <div class="text-muted-foreground mb-1 flex items-center text-xs">
        <span class="flex-1 truncate">{{ group.label }}</span>
        <span>{{ group.items.length }} 镜</span>
      </div>
      <div
        v-for="item in group.items"
        :key="item.id"
        class="mb-1 cursor-pointer rounded border border-solid px-2 py-1.5"
        :class="
          item.id === modelValue
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50'
        "
        @click="emit('update:modelValue', item.id)"
      >
        <div class="flex items-center gap-1.5 text-[13px]">
          <span class="font-medium">镜 {{ item.sceneNo }}</span>
          <span class="flex-1 truncate">{{ item.title || '未命名镜头' }}</span>
        </div>
        <div class="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
          <span>{{ item.duration ? `${item.duration} 秒` : '-' }}</span>
          <div class="flex-1"></div>
          <DictTag
            v-if="item.videoStatus"
            :type="DICT_TYPE.AI_DRAMA_STATUS"
            :value="item.videoStatus"
          />
          <span v-else>未生成</span>
        </div>
      </div>
    </div>
  </div>
</template>
