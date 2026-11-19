<script lang="ts" setup>
import type { DramaCanvasKind, DramaCanvasNode } from '../canvas';

import { computed } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { Handle, Position } from '@vue-flow/core';
import { Image } from 'ant-design-vue';

import { DictTag } from '#/components/dict-tag';

import {
  DRAMA_CANVAS_LABELS,
  DRAMA_IMAGE_PURPOSES,
  DRAMA_CANVAS_ICONS as ICONS,
} from '../canvas';

/** AI 短剧画布：节点卡片 */
defineOptions({ name: 'AiDramaCanvasNodeCard' });

const props = defineProps<{
  imageUrl?: string;
  node: DramaCanvasNode;
  selected?: boolean;
  status?: number; // 关联业务数据的生成状态
  videoUrl?: string;
}>();

const PLACEHOLDERS: Record<DramaCanvasKind, string> = {
  text: '写下故事、对白或制作笔记',
  script: '编写剧本，或连接文本节点',
  image: '填写图片描述',
  video: '填写视频提示词',
  audio: '填写样音文本',
  previs: '在 3D 导演中设计白模动作与机位',
  group: '',
};

/** 媒体区：图片、视频、预演共用 */
const MEDIA_CLASS =
  'bg-muted text-muted-foreground mx-2 flex h-[150px] items-center justify-center overflow-hidden rounded-md text-xs';

const purposeLabel = computed(
  () =>
    DRAMA_IMAGE_PURPOSES.find((item) => item.value === props.node.data.purpose)
      ?.label,
);
</script>

<template>
  <div
    v-if="node.kind === 'group'"
    class="bg-primary/5 rounded-xl border border-dashed px-[18px] py-3.5"
    :class="selected ? 'border-primary' : 'border-border'"
    :style="{
      width: `${node.data.width || 650}px`,
      height: `${node.data.height || 430}px`,
    }"
  >
    <span class="text-[13px] font-semibold">{{ node.data.title }}</span>
  </div>
  <div
    v-else
    class="bg-card w-[280px] overflow-hidden rounded-lg border shadow-sm"
    :class="selected ? 'border-primary' : 'border-border'"
  >
    <Handle
      v-if="node.kind !== 'text'"
      type="target"
      :position="Position.Left"
    />
    <div
      class="text-muted-foreground flex items-center justify-between px-3 pt-2.5 text-xs"
    >
      <span class="flex items-center gap-1">
        <IconifyIcon :icon="ICONS[node.kind]" />
        {{ DRAMA_CANVAS_LABELS[node.kind] }}
        <template v-if="node.kind === 'image'">· {{ purposeLabel }}</template>
      </span>
      <DictTag
        v-if="status !== undefined"
        :type="DICT_TYPE.AI_DRAMA_STATUS"
        :value="status"
      />
      <span v-else>{{ node.data.business ? '已保存到项目' : '草稿' }}</span>
    </div>
    <div class="truncate px-3 py-2 text-sm font-semibold">
      {{ node.data.title }}
    </div>
    <div v-if="node.kind === 'image'" :class="MEDIA_CLASS">
      <Image
        v-if="imageUrl"
        :src="imageUrl"
        width="100%"
        height="100%"
        class="object-cover"
        :wrapper-style="{ width: '100%', height: '100%' }"
      />
      <span v-else>上传图片或填写描述</span>
    </div>
    <div v-else-if="node.kind === 'video'" :class="MEDIA_CLASS">
      <video
        v-if="videoUrl"
        :src="videoUrl"
        class="size-full object-cover"
        muted
      ></video>
      <span v-else>
        {{
          node.data.business ? '已保存为镜头' : '填写画面，连接角色、场景、道具'
        }}
      </span>
    </div>
    <div v-else-if="node.kind === 'previs'" :class="MEDIA_CLASS">
      <span>白模调度 · 动作 · 运镜，双击打开 3D 导演</span>
    </div>
    <p
      class="text-muted-foreground m-[8px_12px_12px] line-clamp-4 whitespace-pre-wrap text-xs leading-[1.6]"
    >
      {{
        (node.kind === 'image' || node.kind === 'video'
          ? node.data.prompt
          : node.data.content) || PLACEHOLDERS[node.kind]
      }}
    </p>
    <Handle type="source" :position="Position.Right" />
  </div>
</template>
