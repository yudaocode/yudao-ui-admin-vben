<script lang="ts" setup>
import type { DirectorDocument } from '../director';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, InputNumber, Slider, Tag } from 'antdv-next';

import { directorActions, totalFrames } from '../director';

/** AI 短剧：3D 导演时间轴，摄影机与各对象的关键帧、动作片段 */
defineOptions({ name: 'AiDramaDirectorTimeline' });

const props = defineProps<{
  document: DirectorDocument;
  frame: number;
  playing: boolean;
  selected: string;
  selectedClip: string;
}>();
const emit = defineEmits<{
  addKey: [];
  clip: [objectId: string, id: string];
  moveKey: [id: string, from: number, to: number, copy: boolean];
  play: [];
  seek: [frame: number];
  select: [id: string];
}>();

const end = computed(() => totalFrames(props.document) - 1);

/** 帧号输入：双向绑定，失焦或回车时跳转；当前帧变化时同步 */
const frameInput = ref<number>(props.frame);
watch(
  () => props.frame,
  (value) => (frameInput.value = value),
);
function handleFrameInput() {
  if (frameInput.value !== props.frame) {
    emit('seek', frameInput.value ?? 0);
  }
  // 无效值（清空）、超出范围时回到当前帧
  frameInput.value = props.frame;
}
function blurOnEnter(event: KeyboardEvent) {
  (event.target as HTMLInputElement).blur();
}

const tracks = computed(() => [
  {
    id: 'camera',
    name: '摄影机 · 运镜',
    keys: props.document.camera.keys,
    clips: [],
  },
  ...props.document.objects.map((item) => ({
    id: item.id,
    name: item.name,
    keys: item.keys,
    clips: item.clips || [],
  })),
]);
const percent = (frame: number) => `${(frame / end.value) * 100}%`;

/** 拖动关键帧：移动，按住 Alt 复制 */
const drag = ref<{
  from: number;
  id: string;
  left: number;
  to: number;
  width: number;
  x: number;
}>();
function handleKeyDown(event: PointerEvent, id: string, from: number) {
  if (props.playing) {
    return;
  }
  const target = event.currentTarget as HTMLElement;
  const rect = target.parentElement!.getBoundingClientRect();
  target.setPointerCapture(event.pointerId);
  drag.value = {
    id,
    from,
    to: from,
    left: rect.left,
    width: rect.width,
    x: event.clientX,
  };
}
function handleKeyMove(event: PointerEvent) {
  if (!drag.value || Math.abs(event.clientX - drag.value.x) < 4) {
    return;
  }
  const to = Math.round(
    ((event.clientX - drag.value.left) / drag.value.width) * end.value,
  );
  drag.value = { ...drag.value, to: Math.max(0, Math.min(end.value, to)) };
}
function handleKeyUp(event: PointerEvent) {
  const value = drag.value;
  if (!value) {
    return;
  }
  drag.value = undefined;
  if (value.to === value.from) {
    emit('select', value.id);
    emit('seek', value.from);
  } else {
    emit('moveKey', value.id, value.from, value.to, event.altKey);
  }
}

function handleTrackClick(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  emit(
    'seek',
    Math.round(((event.clientX - rect.left) / rect.width) * end.value),
  );
}
</script>

<template>
  <div class="bg-card flex h-full flex-col px-4">
    <div class="flex items-center justify-between py-1.5">
      <div class="flex items-center gap-1.5">
        <Button size="small" @click="emit('seek', 0)">
          <IconifyIcon icon="lucide:chevrons-left" />
        </Button>
        <Button size="small" type="primary" ghost @click="emit('play')">
          <IconifyIcon
            :icon="playing ? 'lucide:pause' : 'lucide:play'"
            class="mr-1 inline"
          />
          {{ playing ? '暂停' : '播放' }}
        </Button>
        <Button size="small" @click="emit('seek', end)">
          <IconifyIcon icon="lucide:chevrons-right" />
        </Button>
        <span class="ml-2 text-[13px] tabular-nums">
          {{ (frame / 24).toFixed(2) }} / {{ document.duration.toFixed(2) }} 秒
        </span>
        <InputNumber
          v-model:value="frameInput"
          :min="0"
          :max="end"
          :precision="0"
          size="small"
          class="!w-[100px]"
          @blur="handleFrameInput"
          @press-enter="blurOnEnter"
        />
        <span class="text-muted-foreground text-xs">帧</span>
      </div>
      <Button size="small" :disabled="!selected" @click="emit('addKey')">
        添加关键帧
      </Button>
    </div>
    <div
      v-if="document.markers?.length"
      class="flex gap-1 overflow-auto pb-1.5"
    >
      <Tag
        v-for="marker in document.markers"
        :key="`${marker.frame}-${marker.label}`"
        class="cursor-pointer"
        @click="emit('seek', marker.frame)"
      >
        {{ (marker.frame / 24).toFixed(2) }}s · {{ marker.label }}
      </Tag>
    </div>
    <div class="flex items-center">
      <span class="text-muted-foreground w-[140px] shrink-0 text-xs">
        时间 / 24 fps
      </span>
      <Slider
        :value="frame"
        :min="0"
        :max="end"
        :tooltip="{ open: false }"
        class="mx-1.5 flex-1"
        @change="(value) => emit('seek', Number(value))"
      />
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto">
      <div v-for="track in tracks" :key="track.id">
        <div
          class="border-border flex h-[26px] items-center border-t border-solid"
        >
          <span
            class="w-[140px] shrink-0 cursor-pointer truncate text-xs"
            :class="{ 'text-primary': track.id === selected }"
            @click="emit('select', track.id)"
          >
            {{ track.name }}
          </span>
          <div
            class="border-border relative h-[22px] flex-1 cursor-crosshair border-l border-solid"
            @click.self="handleTrackClick"
          >
            <div
              class="bg-primary pointer-events-none absolute top-0 bottom-0 w-px"
              :style="{ left: percent(frame) }"
            ></div>
            <span
              v-for="key in track.keys"
              :key="key.frame"
              class="absolute top-[7px] size-2 cursor-ew-resize touch-none border border-solid border-white"
              :class="track.id === selected ? 'bg-primary' : 'bg-primary/60'"
              :style="{
                left: percent(
                  drag?.id === track.id && drag.from === key.frame
                    ? drag.to
                    : key.frame,
                ),
                transform: 'translateX(-50%) rotate(45deg)',
              }"
              :title="`${key.frame} 帧 · 拖动移动，按住 Alt 拖动复制`"
              @pointerdown.stop="handleKeyDown($event, track.id, key.frame)"
              @pointermove.stop="handleKeyMove"
              @pointerup.stop="handleKeyUp"
              @pointercancel="drag = undefined"
            ></span>
          </div>
        </div>
        <div
          v-if="track.clips.length"
          class="border-border flex h-[26px] items-center border-t border-solid"
        >
          <span
            class="text-muted-foreground w-[140px] shrink-0 truncate pl-4 text-xs"
          >
            动作编排
          </span>
          <div
            class="border-border relative h-[22px] flex-1 cursor-crosshair border-l border-solid"
            @click.self="handleTrackClick"
          >
            <div
              class="bg-primary pointer-events-none absolute top-0 bottom-0 w-px"
              :style="{ left: percent(frame) }"
            ></div>
            <span
              v-for="clip in track.clips"
              :key="clip.id"
              class="text-primary bg-primary/10 absolute top-0.5 box-border h-[18px] cursor-pointer overflow-hidden rounded-[3px] border border-solid px-1.5 text-[11px] leading-4 whitespace-nowrap"
              :class="
                track.id === selected && clip.id === selectedClip
                  ? 'border-primary'
                  : 'border-primary/30'
              "
              :style="{
                left: `${(clip.start / (end + 1)) * 100}%`,
                width: `${((clip.end - clip.start) / (end + 1)) * 100}%`,
              }"
              @click.stop="emit('clip', track.id, clip.id)"
            >
              {{ directorActions[clip.action] }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="drag" class="text-primary pb-1 text-xs">
      {{ drag.to }} 帧 · 松开{{
        drag.from === 0 ? '（第 0 帧请按住 Alt 复制）' : '移动，按住 Alt 复制'
      }}
    </div>
  </div>
</template>
