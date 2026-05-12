<script lang="ts" setup>
import type { Nullable, Recordable } from '@vben/types';

import { ref, unref } from 'vue';

import { Button, Card } from 'antdv-next';

import desc from './desc.vue';
import lyric from './lyric.vue';

defineOptions({ name: 'AiMusicModeIndex' });

const emits = defineEmits(['generateMusic']);

const generateMode = ref('lyric');

const modeRef = ref<Nullable<{ formData: Recordable<any> }>>(null);

function generateMusic() {
  emits('generateMusic', { formData: unref(modeRef)?.formData });
}
</script>

<template>
  <Card class="!mb-0 h-full w-80">
    <RadioGroup v-model:value="generateMode" class="mb-4">
      <RadioButton value="desc"> 描述模式 </RadioButton>
      <RadioButton value="lyric"> 歌词模式 </RadioButton>
    </RadioGroup>

    <!-- 描述模式/歌词模式 切换 -->
    <component :is="generateMode === 'desc' ? desc : lyric" ref="modeRef" />

    <Button type="primary" shape="round" class="w-full" @click="generateMusic">
      创作音乐
    </Button>
  </Card>
</template>
