<script lang="ts" setup>
import type {
  DramaCanvasDocument,
  DramaCanvasKind,
  DramaCanvasNode,
} from '../canvas';

import type { AiDramaProjectApi } from '#/api/ai/drama/project';
import type { AiModelModelApi } from '#/api/ai/model/model';

import { computed } from 'vue';

import { AiDramaStatusEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElImage,
  ElInput,
  ElInputNumber,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
} from 'element-plus';

import { ImageUpload } from '#/components/upload';
import { getVideoModelCapability } from '#/views/ai/utils/video';

import { DRAMA_CANVAS_LABELS, DRAMA_IMAGE_PURPOSES } from '../canvas';

/** AI 短剧画布：节点编辑 */
defineOptions({ name: 'AiDramaCanvasInspector' });

const props = defineProps<{
  busy: boolean;
  detail: AiDramaProjectApi.ProjectDetail;
  doc: DramaCanvasDocument;
  imageModels: AiModelModelApi.Model[];
  node: DramaCanvasNode;
  videoModels: AiModelModelApi.Model[];
  voiceModels: AiModelModelApi.Model[];
}>();
const emit = defineEmits<{
  close: [];
  generate: [];
  openDirector: [];
  plan: [];
  removeEdge: [id: string];
  selectImage: [index: number];
  sync: [];
}>();

const CONTENT_LABELS: Record<DramaCanvasKind, string> = {
  text: '内容',
  script: '剧本正文',
  image: '备注',
  video: '画面描述',
  audio: '样音文本',
  previs: '预演说明',
  group: '',
};
const PROMPT_LABELS: Partial<Record<DramaCanvasKind, string>> = {
  script: '打磨意见',
  image: '图片描述',
  video: '视频提示词',
  audio: '声音描述',
};
const GENERATE_LABELS: Partial<Record<DramaCanvasKind, string>> = {
  script: '保存并打磨剧本',
  image: '保存并生成图片',
  video: '保存并生成视频',
  audio: '保存并合成样音',
};
const BUSINESS_LABELS: Partial<Record<DramaCanvasKind, string>> = {
  script: '项目剧本',
  image: '项目资产',
  video: '项目镜头',
  audio: '角色声音',
};

/** 节点数据：表单直接编辑它（节点属于画布文档，由画布保存） */
const nodeData = computed(() => props.node.data);

/** 执行按钮：已保存为镜头的视频节点，再次生成即生成新版本 */
const generateLabel = computed(() =>
  props.node.kind === 'video' && props.node.data.business
    ? '生成新版本'
    : GENERATE_LABELS[props.node.kind],
);

const modelList = computed(() => {
  if (props.node.kind === 'image' && props.node.data.purpose !== 'frame') {
    return props.imageModels;
  }
  if (props.node.kind === 'video') {
    return props.videoModels;
  }
  return props.node.kind === 'audio' ? props.voiceModels : [];
});
const modelOptions = computed(() =>
  modelList.value.map((item) => ({ label: item.name, value: item.id })),
);

const resolutions = computed(() => {
  const model = props.videoModels.find(
    (item) => item.id === props.node.data.modelId,
  );
  return model
    ? getVideoModelCapability(model.platform, model.model).resolutions
    : [];
});
const resolutionOptions = computed(() =>
  resolutions.value.map((item) => ({ label: item, value: item })),
);

const inputs = computed(() =>
  props.doc.edges
    .filter((edge) => edge.target === props.node.id)
    .map((edge) => ({
      edge,
      node: props.doc.nodes.find((item) => item.id === edge.source)!,
    }))
    .filter((item) => item.node),
);

/** 关联的角色形象、场景：候选图、选用、失败原因 */
const businessImage = computed(() => {
  const business = props.node.data.business;
  if (props.node.kind !== 'image' || !business) {
    return undefined;
  }
  if (business.type === 'character') {
    return props.detail.characters
      .find((item) => item.id === business.id)
      ?.appearances.find((item) => item.id === business.appearanceId);
  }
  if (business.type === 'location') {
    return props.detail.locations.find((item) => item.id === business.id);
  }
  return undefined;
});
const candidates = computed(() => businessImage.value?.imageUrls || []);
const selectedIndex = computed(() => businessImage.value?.selectedIndex);

/** 失败原因：仅关联的任务为已失败时展示；镜头按视频状态，其它按图片状态 */
const errorMessage = computed(() => {
  const business = props.node.data.business;
  if (business?.type === 'storyboard') {
    const storyboard = props.detail.storyboards.find(
      (item) => item.id === business.id,
    );
    return storyboard?.videoStatus === AiDramaStatusEnum.FAIL
      ? storyboard.errorMessage
      : undefined;
  }
  if (business?.type === 'prop') {
    const asset = props.detail.visualAssets.find(
      (item) => item.id === business.id,
    );
    return asset?.status === AiDramaStatusEnum.FAIL
      ? asset.errorMessage
      : undefined;
  }
  const image = businessImage.value;
  return image?.status === AiDramaStatusEnum.FAIL
    ? image.errorMessage
    : undefined;
});
</script>

<template>
  <div class="bg-card border-border flex h-full w-[360px] flex-col border-l">
    <div
      class="border-border flex items-center justify-between border-b px-4 py-3"
    >
      <span class="text-sm font-semibold">
        {{ DRAMA_CANVAS_LABELS[node.kind] }}节点
      </span>
      <ElButton link type="primary" size="small" @click="emit('close')">
        <IconifyIcon icon="lucide:x" />
      </ElButton>
    </div>
    <div class="flex-1 overflow-auto">
      <ElForm label-position="top" class="px-4 pt-3">
        <ElFormItem label="名称">
          <ElInput v-model="nodeData.title" :maxlength="60" />
        </ElFormItem>
        <ElFormItem v-if="node.kind === 'image'" label="用途">
          <ElRadioGroup
            v-model="nodeData.purpose"
            :disabled="!!node.data.business"
          >
            <ElRadioButton
              v-for="item in DRAMA_IMAGE_PURPOSES"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem
          v-if="node.kind !== 'group'"
          :label="CONTENT_LABELS[node.kind]"
        >
          <ElInput
            v-model="nodeData.content"
            type="textarea"
            :rows="node.kind === 'script' ? 12 : 4"
          />
        </ElFormItem>
        <ElFormItem
          v-if="PROMPT_LABELS[node.kind]"
          :label="PROMPT_LABELS[node.kind]"
        >
          <ElInput v-model="nodeData.prompt" type="textarea" :rows="3" />
          <div
            v-if="node.kind === 'audio'"
            class="text-muted-foreground text-xs"
          >
            声音描述写入角色，生成镜头视频时加入提示词；语音合成只按音色标识，不支持按描述设计音色
          </div>
        </ElFormItem>
        <ElFormItem v-if="node.kind === 'image'" label="参考图">
          <ImageUpload
            v-model="nodeData.url"
            :max-size="10"
            :show-description="false"
            directory="ai/drama"
          />
        </ElFormItem>
        <ElFormItem v-if="modelOptions.length > 0" label="模型">
          <ElSelect
            v-model="nodeData.modelId"
            filterable
            clearable
            class="w-full"
          >
            <ElOption
              v-for="item in modelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="node.kind === 'audio'" label="音色标识">
          <ElInput
            v-model="nodeData.voice"
            placeholder="服务商的音色标识，例如 longxiaochun"
            :maxlength="128"
          />
        </ElFormItem>
        <template v-if="node.kind === 'video'">
          <ElFormItem v-if="resolutions.length > 0" label="分辨率">
            <ElSelect v-model="nodeData.resolution" clearable class="w-full">
              <ElOption
                v-for="item in resolutionOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="镜头顺序">
            <ElInputNumber v-model="nodeData.order" :min="1" :max="999" />
          </ElFormItem>
        </template>

        <!-- 输入节点 -->
        <ElFormItem v-if="inputs.length > 0" label="输入">
          <div class="w-full">
            <div
              v-for="item in inputs"
              :key="item.edge.id"
              class="flex items-center justify-between py-0.5 text-[13px]"
            >
              <span class="truncate">
                {{ DRAMA_CANVAS_LABELS[item.node.kind] }} ·
                {{ item.node.data.title }}
              </span>
              <ElButton
                link
                type="danger"
                size="small"
                @click="emit('removeEdge', item.edge.id)"
              >
                断开
              </ElButton>
            </div>
          </div>
        </ElFormItem>

        <!-- 候选图：选用后写入角色形象、场景 -->
        <ElFormItem v-if="candidates.length > 0" label="候选图">
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(url, index) in candidates"
              :key="url"
              class="size-[72px] cursor-pointer overflow-hidden rounded"
              :class="
                index === selectedIndex
                  ? 'outline-primary outline outline-2'
                  : ''
              "
              @click="emit('selectImage', index)"
            >
              <ElImage :src="url" fit="cover" class="size-full" />
            </div>
          </div>
        </ElFormItem>
        <ElFormItem v-if="errorMessage" label="失败原因">
          <span class="text-destructive text-xs">{{ errorMessage }}</span>
        </ElFormItem>
      </ElForm>
    </div>
    <div
      v-if="node.kind !== 'text' && node.kind !== 'group'"
      class="border-border border-t p-3"
    >
      <ElButton
        v-if="node.kind === 'previs'"
        type="primary"
        class="w-full"
        @click="emit('openDirector')"
      >
        打开 3D 导演
      </ElButton>
      <template v-else>
        <!-- 「保存到项目」写回节点关联的业务数据；画布布局在顶部「保存画布」 -->
        <div class="text-muted-foreground mb-2 text-xs">
          「保存到项目」写回{{
            BUSINESS_LABELS[node.kind]
          }}，不发起生成；画布在顶部保存
        </div>
        <div class="flex justify-end gap-2">
          <ElButton
            v-if="node.kind === 'script'"
            :disabled="busy"
            @click="emit('plan')"
          >
            拆分分镜
          </ElButton>
          <ElButton :disabled="busy" @click="emit('sync')">保存到项目</ElButton>
          <ElButton
            v-if="node.data.purpose !== 'frame'"
            type="primary"
            :loading="busy"
            @click="emit('generate')"
          >
            {{ generateLabel }}
          </ElButton>
        </div>
      </template>
    </div>
  </div>
</template>
