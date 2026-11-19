<script lang="ts" setup>
import type { Connection } from '@vue-flow/core';

import type { DramaResourceKind } from '../canvas';

import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import { computed } from 'vue';

import { confirm } from '@vben/common-ui';
import { isAiDramaRunning } from '@vben/constants';

import { Background } from '@vue-flow/background';
import {
  Handle,
  MarkerType,
  Position,
  useVueFlow,
  VueFlow,
} from '@vue-flow/core';
import { Image, message } from 'ant-design-vue';

import { updateDramaStoryboard } from '#/api/ai/drama/storyboard';

import {
  bindDramaResource,
  buildDramaResourceGraph,
  DRAMA_RESOURCE_LABELS,
} from '../canvas';

/** AI 短剧画布：资源关系图。按项目的角色形象、场景、道具、角色声音与镜头构建；连线即镜头的引用，连接、断开直接保存到分镜 */
defineOptions({ name: 'AiDramaResourceGraph' });

const props = defineProps<{ detail: AiDramaProjectApi.ProjectDetail }>();
const emit = defineEmits<{ refresh: [] }>();

const { fitView } = useVueFlow(`drama-resource-${props.detail.project.id}`);

/** 资源列的横坐标：资源在左，镜头在右 */
const COLUMNS: Record<DramaResourceKind, number> = {
  character: 0,
  voice: 0,
  location: 300,
  prop: 300,
  shot: 700,
};

const graph = computed(() => buildDramaResourceGraph(props.detail));

const nodes = computed(() => {
  const rows: Record<number, number> = {};
  return graph.value.resources.map((item) => {
    const x = COLUMNS[item.kind];
    rows[x] = (rows[x] ?? -1) + 1;
    return {
      id: item.id,
      type: 'resource',
      position: { x, y: rows[x]! * 90 },
      data: item,
    };
  });
});
const edges = computed(() =>
  graph.value.links.map((link) => ({
    ...link,
    markerEnd: MarkerType.ArrowClosed,
    interactionWidth: 16,
  })),
);

function findResource(id: string) {
  return graph.value.resources.find((item) => item.id === id);
}

function isValidConnection(connection: Connection) {
  return (
    findResource(connection.source)?.kind !== 'shot' &&
    findResource(connection.target)?.kind === 'shot'
  );
}

/** 保存镜头引用：连接或断开 */
async function saveReference(
  sourceId: string,
  targetId: string,
  remove: boolean,
) {
  const resource = findResource(sourceId);
  const storyboard = findResource(targetId)?.storyboard;
  if (!resource || !storyboard) {
    return;
  }
  if (isAiDramaRunning(storyboard.videoStatus)) {
    message.warning('镜头视频生成中，不能修改引用');
    return;
  }
  await updateDramaStoryboard(
    bindDramaResource(props.detail, storyboard, resource, remove),
  );
  message.success(remove ? '已断开引用' : '已保存引用');
  emit('refresh');
}

function handleConnect(connection: Connection) {
  return saveReference(connection.source, connection.target, false);
}

async function handleUnbind(edgeId: string) {
  const link = graph.value.links.find((item) => item.id === edgeId);
  if (!link) {
    return;
  }
  try {
    await confirm(
      `确认断开「${findResource(link.source)?.title}」与「${findResource(link.target)?.title}」的引用？`,
    );
  } catch {
    return;
  }
  await saveReference(link.source, link.target, true);
}
</script>

<template>
  <VueFlow
    :id="`drama-resource-${detail.project.id}`"
    :nodes="nodes"
    :edges="edges"
    :min-zoom="0.1"
    :max-zoom="1.6"
    :delete-key-code="null"
    :nodes-draggable="true"
    :is-valid-connection="isValidConnection"
    @connect="handleConnect"
    @edge-click="({ edge }) => handleUnbind(edge.id)"
    @nodes-initialized="fitView({ padding: 0.15, maxZoom: 0.9 })"
  >
    <Background :gap="22" :size="1" />
    <template #node-resource="{ data }">
      <div
        class="bg-card flex items-center gap-2 rounded-md border px-2.5 py-2"
        :class="
          data.kind === 'shot'
            ? 'border-primary/50 w-[300px]'
            : 'border-border w-[240px]'
        "
      >
        <Handle
          v-if="data.kind === 'shot'"
          type="target"
          :position="Position.Left"
        />
        <Image
          v-if="data.imageUrl"
          :src="data.imageUrl"
          :width="48"
          :height="48"
          class="shrink-0 rounded object-cover"
        />
        <div class="min-w-0">
          <div class="text-muted-foreground text-xs">
            {{ DRAMA_RESOURCE_LABELS[data.kind as DramaResourceKind] }}
          </div>
          <div class="truncate text-[13px] font-semibold">{{ data.title }}</div>
          <div class="text-muted-foreground truncate text-xs">
            {{ data.subtitle }}
          </div>
        </div>
        <Handle
          v-if="data.kind !== 'shot'"
          type="source"
          :position="Position.Right"
        />
      </div>
    </template>
  </VueFlow>
</template>
