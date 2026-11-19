<script lang="ts" setup>
import type {
  ContinuityFormData,
  StoryboardFieldsState,
  StoryboardFormData,
} from './storyboard-fields';

import type { AiDramaProjectApi } from '#/api/ai/drama/project';
import type { AiDramaStoryboardApi } from '#/api/ai/drama/storyboard';
import type { AiModelModelApi } from '#/api/ai/model/model';

import { computed, onMounted, ref, watch } from 'vue';

import { AiModelTypeEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  AutoComplete,
  Button,
  Checkbox,
  Col,
  Divider,
  Form,
  FormItem,
  Input,
  InputNumber,
  RadioButton,
  RadioGroup,
  Row,
  Select,
  Switch,
  Textarea,
} from 'ant-design-vue';

import { getModelSimpleList } from '#/api/ai/model/model';
import { ImageUpload } from '#/components/upload';
import { getDramaProps } from '#/views/ai/utils/drama';
import { getVideoModelCapability } from '#/views/ai/utils/video';

/** AI 短剧：镜头的编辑字段，单镜编辑区与新增镜头弹窗共用；按生成设置、镜头内容、提示词、参考素材分区 */
defineOptions({ name: 'AiDramaStoryboardFields' });

const props = defineProps<{ detail: AiDramaProjectApi.ProjectDetail }>();

const labelCol = { flex: '100px' };
const wrapperCol = { flex: 'auto' };

const formData = ref<StoryboardFormData>({
  dialogues: [],
  actingNotes: [],
  characters: [],
  visualAssetIds: [],
});
/** 连续性设置：未在表单编辑的规划字段原样保留 */
const continuity = ref<ContinuityFormData>({
  referenceVideoUrls: [],
  materialUrls: [],
});
const propsAuto = ref(true); // 道具按关联的镜头自动选择：提交时道具为空
const manualStartFrameUrl = ref(''); // 手动起始帧：提交时转为连续性设置的 manualStartFrame
const promptMode = ref<'edit' | 'read'>('read'); // 提示词：默认阅读
const videoModels = ref<AiModelModelApi.Model[]>([]); // 视频模型列表：用于取所选模型可选的分辨率
const loadedSnapshot = ref(''); // 加载时的快照：用于判断是否有未保存的修改
const uploadKey = ref(0); // 上传组件的重建标记：加载镜头后重置

/** 单镜指定的视频模型：未指定、模型列表未加载或模型已删除时为空 */
const videoModel = computed(() =>
  videoModels.value.find((item) => item.id === formData.value.videoModelId),
);
/** 所选视频模型可选的分辨率：与 AI 视频一致 */
const resolutions = computed(() =>
  videoModel.value
    ? getVideoModelCapability(videoModel.value.platform, videoModel.value.model)
        .resolutions
    : [],
);
/**
 * 单镜指定了视频模型时，分辨率只取该模型可选的值：为空（包括历史数据）或不可选时改为该模型的默认分辨率，
 * 模型没有可选分辨率时清空、不传；未指定模型时跟随项目设置，不处理
 */
watch(
  () => [videoModel.value, formData.value.videoResolution] as const,
  ([model, resolution]) => {
    if (!model) {
      return;
    }
    const list = resolutions.value;
    if (list.length === 0) {
      if (resolution) {
        formData.value.videoResolution = undefined;
      }
      return;
    }
    if (!resolution || !list.includes(resolution)) {
      formData.value.videoResolution = list[0];
    }
  },
);

const propList = computed(() => getDramaProps(props.detail.visualAssets));
/** 站位：取自所选场景的可站位置 */
const slots = computed(
  () =>
    props.detail.locations.find((item) => item.id === formData.value.locationId)
      ?.availableSlots || [],
);
const videoModelOptions = computed(() =>
  videoModels.value.map((item) => ({ label: item.name, value: item.id })),
);
const resolutionOptions = computed(() =>
  resolutions.value.map((item) => ({ label: item, value: item })),
);
const sceneTypeOptions = computed(() =>
  getDictOptions(DICT_TYPE.AI_DRAMA_SCENE_TYPE, 'number'),
);
const locationOptions = computed(() =>
  props.detail.locations.map((item) => ({ label: item.name, value: item.id })),
);
const characterOptions = computed(() =>
  props.detail.characters.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);
/** 出场角色的形象：按角色分组 */
const appearanceOptions = computed(() =>
  props.detail.characters.map((character) => ({
    label: character.name,
    options: character.appearances.map((appearance) => ({
      label: `${character.name} · 形象 ${appearance.appearanceIndex}`,
      value: appearance.id,
    })),
  })),
);
const slotOptions = computed(() =>
  slots.value.map((item) => ({ label: item, value: item })),
);
const propOptions = computed(() =>
  propList.value.map((item) => ({ label: item.title, value: item.id })),
);
const motionOptions = computed(() =>
  (props.detail.motionReferences || []).map((item) => ({
    label: item.name,
    value: item.fileUrl,
  })),
);

/** 当前的编辑状态：切换镜头时暂存 */
function getState(): StoryboardFieldsState {
  return {
    formData: formData.value,
    continuity: continuity.value,
    propsAuto: propsAuto.value,
    manualStartFrameUrl: manualStartFrameUrl.value,
  };
}
function snapshot() {
  return JSON.stringify(getState());
}

/** 是否有未保存的修改 */
const dirty = computed(
  () => !!loadedSnapshot.value && snapshot() !== loadedSnapshot.value,
);

/**
 * 加载镜头：复制一份（台词、表演、出场角色、道具、连续性设置），修改不影响列表；为空时为新增
 *
 * @param storyboard 镜头
 * @param draft 之前暂存的未保存修改：有时恢复它，未保存状态保留
 */
function load(
  storyboard?: AiDramaStoryboardApi.Storyboard,
  draft?: StoryboardFieldsState,
) {
  if (storyboard) {
    formData.value = {
      ...storyboard,
      duration: storyboard.duration || 5,
      dialogues: (storyboard.dialogues || []).map((item) => ({ ...item })),
      actingNotes: (storyboard.actingNotes || []).map((item) => ({ ...item })),
      characters: (storyboard.characters || []).map((item) => ({ ...item })),
      visualAssetIds: [...(storyboard.visualAssetIds || [])],
      videoResolution: storyboard.videoResolution || undefined,
    };
    const value = storyboard.continuity || {};
    continuity.value = {
      ...value,
      useFirstFrame: value.useFirstFrame !== false,
      includeLocation: value.includeLocation !== false,
      referenceVideoUrls: [...(value.referenceVideoUrls || [])],
      materialUrls: [...(value.materialUrls || [])],
    };
    propsAuto.value = !storyboard.visualAssetIds;
    manualStartFrameUrl.value = value.manualStartFrame?.url || '';
  } else {
    formData.value = {
      duration: 5,
      dialogues: [],
      actingNotes: [],
      characters: [],
      visualAssetIds: [],
    };
    continuity.value = {
      useFirstFrame: true,
      includeLocation: true,
      referenceVideoUrls: [],
      materialUrls: [],
    };
    propsAuto.value = true;
    manualStartFrameUrl.value = '';
  }
  loadedSnapshot.value = snapshot();
  if (draft) {
    formData.value = draft.formData;
    continuity.value = draft.continuity;
    propsAuto.value = draft.propsAuto;
    manualStartFrameUrl.value = draft.manualStartFrameUrl;
  }
  uploadKey.value++;
}

/** 构建提交的数据 */
function buildData() {
  return {
    ...formData.value,
    projectId: props.detail.project.id,
    dialogues: formData.value.dialogues.filter((item) => item.line?.trim()),
    actingNotes: formData.value.actingNotes.filter((item) =>
      item.acting?.trim(),
    ),
    characters: formData.value.characters.filter((item) => item.appearanceId),
    // 为空表示按道具关联的镜头序号；空数组表示没有道具
    visualAssetIds: propsAuto.value ? undefined : formData.value.visualAssetIds,
    continuity: {
      ...continuity.value,
      manualStartFrame: manualStartFrameUrl.value
        ? { url: manualStartFrameUrl.value }
        : undefined,
    },
    // 视频模型为空时清空，生成时使用默认的视频模型；分辨率空串表示不传
    videoResolution: formData.value.videoModelId
      ? formData.value.videoResolution || ''
      : '',
  };
}

defineExpose({ load, getState, buildData, dirty });

onMounted(async () => {
  videoModels.value = await getModelSimpleList(AiModelTypeEnum.VIDEO);
});
</script>

<template>
  <Form
    :model="formData"
    :label-col="labelCol"
    :wrapper-col="wrapperCol"
    label-align="right"
  >
    <Divider orientation="left">生成设置</Divider>
    <Row :gutter="12">
      <Col :span="10">
        <FormItem label="视频模型">
          <Select
            v-model:value="formData.videoModelId"
            :options="videoModelOptions"
            allow-clear
            show-search
            option-filter-prop="label"
            placeholder="跟随默认视频模型"
            class="w-full"
          />
        </FormItem>
      </Col>
      <Col :span="7">
        <FormItem label="分辨率">
          <Select
            v-model:value="formData.videoResolution"
            :disabled="!formData.videoModelId"
            :options="resolutionOptions"
            allow-clear
            placeholder="跟随默认"
            class="w-full"
          />
        </FormItem>
      </Col>
      <Col :span="7">
        <FormItem label="时长（秒）">
          <InputNumber
            v-model:value="formData.duration"
            :min="1"
            :max="60"
            class="w-full"
          />
        </FormItem>
      </Col>
    </Row>
    <FormItem label="起始帧">
      <div class="flex flex-wrap items-center gap-3">
        <Switch v-model:checked="continuity.useFirstFrame" />
        <span>使用起始帧</span>
        <Switch v-model:checked="continuity.includeLocation" />
        <span>参考图包含场景</span>
      </div>
      <div class="text-muted-foreground text-xs leading-[18px]">
        视频模型留空时跟随默认视频模型；设置后本镜固定使用。使用起始帧时按图生视频，不使用时由支持参考生视频的模型带上参考素材与选用样音
      </div>
    </FormItem>

    <Divider orientation="left">镜头内容</Divider>
    <Row :gutter="12">
      <Col :span="8">
        <FormItem label="镜头序号">
          <InputNumber
            v-model:value="formData.sceneNo"
            :min="1"
            class="w-full"
          />
        </FormItem>
      </Col>
      <Col :span="16">
        <FormItem label="镜头标题">
          <Input v-model:value="formData.title" :maxlength="128" />
        </FormItem>
      </Col>
    </Row>
    <FormItem label="景别">
      <Input
        v-model:value="formData.shotType"
        placeholder="例如：中景"
        :maxlength="32"
      />
    </FormItem>
    <FormItem label="运镜">
      <Input
        v-model:value="formData.cameraMove"
        placeholder="例如：缓慢推进"
        :maxlength="64"
      />
    </FormItem>
    <FormItem label="场景类型">
      <Select
        v-model:value="formData.sceneType"
        :options="sceneTypeOptions"
        allow-clear
        placeholder="请选择"
        class="w-full"
      />
    </FormItem>
    <FormItem label="画面描述">
      <Textarea
        v-model:value="formData.sceneText"
        :rows="3"
        :maxlength="2000"
        show-count
      />
    </FormItem>
    <FormItem label="台词">
      <div class="w-full">
        <div
          v-for="(dialogue, index) in formData.dialogues"
          :key="index"
          class="mb-1.5 flex gap-1.5"
        >
          <Select
            v-model:value="dialogue.characterId"
            :options="characterOptions"
            allow-clear
            placeholder="旁白"
            class="w-36"
          />
          <Input
            v-model:value="dialogue.line"
            placeholder="台词"
            class="flex-1"
          />
          <Button type="link" danger @click="formData.dialogues.splice(index, 1)">
            删除
          </Button>
        </div>
        <Button type="link" @click="formData.dialogues.push({ line: '' })">
          + 添加台词
        </Button>
      </div>
    </FormItem>
    <FormItem label="表演指导">
      <div class="w-full">
        <div
          v-for="(note, index) in formData.actingNotes"
          :key="index"
          class="mb-1.5 flex gap-1.5"
        >
          <Input v-model:value="note.name" placeholder="角色" class="w-36" />
          <Input
            v-model:value="note.acting"
            placeholder="表演指令"
            class="flex-1"
          />
          <Button
            type="link"
            danger
            @click="formData.actingNotes.splice(index, 1)"
          >
            删除
          </Button>
        </div>
        <Button
          type="link"
          @click="formData.actingNotes.push({ name: '', acting: '' })"
        >
          + 添加表演指导
        </Button>
      </div>
    </FormItem>

    <Divider orientation="left">提示词</Divider>
    <div class="mb-2 flex justify-end">
      <RadioGroup v-model:value="promptMode" size="small" button-style="solid">
        <RadioButton value="read">阅读</RadioButton>
        <RadioButton value="edit">编辑</RadioButton>
      </RadioGroup>
    </div>
    <template v-if="promptMode === 'read'">
      <FormItem label="视频提示词">
        <div class="w-full whitespace-pre-wrap break-all text-sm leading-[22px]">
          {{ formData.videoPrompt || formData.sceneText || '未填写，使用画面描述' }}
        </div>
      </FormItem>
      <FormItem label="关键帧提示词">
        <div class="w-full whitespace-pre-wrap break-all text-sm leading-[22px]">
          {{ formData.imagePrompt || formData.sceneText || '未填写，使用画面描述' }}
        </div>
      </FormItem>
    </template>
    <template v-else>
      <FormItem label="视频提示词">
        <Textarea
          v-model:value="formData.videoPrompt"
          :rows="4"
          placeholder="为空时使用画面描述"
          :maxlength="2000"
        />
      </FormItem>
      <FormItem label="关键帧提示词">
        <Textarea
          v-model:value="formData.imagePrompt"
          :rows="2"
          placeholder="为空时使用画面描述"
          :maxlength="2000"
        />
      </FormItem>
    </template>

    <Divider orientation="left">参考素材</Divider>
    <FormItem label="场景">
      <Select
        v-model:value="formData.locationId"
        :options="locationOptions"
        allow-clear
        placeholder="选择场景"
        class="w-full"
      />
    </FormItem>
    <FormItem label="出场角色">
      <div class="w-full">
        <div
          v-for="(item, index) in formData.characters"
          :key="index"
          class="mb-1.5 flex gap-1.5"
        >
          <Select
            v-model:value="item.appearanceId"
            :options="appearanceOptions"
            placeholder="选择角色形象"
            class="flex-1"
          />
          <AutoComplete
            v-model:value="item.slot"
            :options="slotOptions"
            allow-clear
            placeholder="站位"
            class="w-40"
          />
          <Button
            type="link"
            danger
            @click="formData.characters.splice(index, 1)"
          >
            删除
          </Button>
        </div>
        <Button type="link" @click="formData.characters.push({})">
          + 添加角色
        </Button>
      </div>
    </FormItem>
    <FormItem label="道具">
      <div class="w-full">
        <Checkbox v-model:checked="propsAuto">按道具关联的镜头自动选择</Checkbox>
        <Select
          v-if="!propsAuto"
          v-model:value="formData.visualAssetIds"
          :options="propOptions"
          mode="multiple"
          placeholder="不选表示没有道具"
          class="mt-1 w-full"
        />
      </div>
    </FormItem>
    <FormItem label="动作参考视频">
      <Select
        v-model:value="continuity.referenceVideoUrls"
        :options="motionOptions"
        mode="tags"
        placeholder="从动作参考中选择，或输入视频地址后回车"
        class="w-full"
      />
    </FormItem>
    <FormItem label="素材图片">
      <ImageUpload
        :key="`material-${uploadKey}`"
        v-model:value="continuity.materialUrls"
        :max-number="9"
        :max-size="10"
        :show-description="false"
        directory="ai/drama"
        multiple
      />
    </FormItem>
    <FormItem label="手动起始帧">
      <div class="w-full">
        <ImageUpload
          :key="`start-${uploadKey}`"
          v-model:value="manualStartFrameUrl"
          :max-size="10"
          :show-description="false"
          directory="ai/drama"
        />
        <div class="text-muted-foreground mt-1.5 text-xs leading-[18px]">
          使用起始帧时，优先使用手动起始帧，否则使用关键帧
        </div>
      </div>
    </FormItem>
  </Form>
</template>
