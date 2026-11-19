<script lang="ts" setup>
import type { AiModelModelApi } from '#/api/ai/model/model';
import type { AiVideoApi } from '#/api/ai/video';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  AI_VIDEO_MODE_OPTIONS,
  AiModelTypeEnum,
  AiVideoModeEnum,
  AiVideoTypeEnum,
} from '@vben/constants';

import {
  Button,
  Card,
  Form,
  FormItem,
  message,
  RadioButton,
  RadioGroup,
  TabPane,
  Tabs,
  Textarea,
} from 'ant-design-vue';

import { getModelSimpleList } from '#/api/ai/model/model';
import { generateVideo } from '#/api/ai/video';
import { FileUpload, ImageUpload } from '#/components/upload';
import {
  getVideoInputRoles,
  getVideoModelCapability,
  isVideoModelOfType,
} from '#/views/ai/utils/video';

import ModelSelect from './model-select.vue';
import ParamsForm from './params-form.vue';

/** AI 视频：左侧创作面板（视频生成、数字人口播、动作模仿） */
defineOptions({ name: 'AiVideoCreatePanel' });

const emit = defineEmits<{
  submitted: []; // 提交成功，用于刷新作品列表
}>();

const IMAGE_MAX_MB = 10; // 图片的大小上限
const IMAGE_ACCEPT = ['jpg', 'jpeg', 'png', 'webp']; // 图片的格式

const submitting = ref(false); // 提交中
const formData = reactive({
  type: AiVideoTypeEnum.GENERATE,
  mode: AiVideoModeEnum.TEXT as string,
  modelId: undefined as number | undefined,
  prompt: '',
  resolution: undefined as string | undefined,
  ratio: undefined as string | undefined,
  duration: undefined as number | undefined,
});
const options = ref<AiVideoApi.VideoOptions>({}); // 其它生成参数
const inputs = reactive({
  first_frame: '',
  last_frame: '',
  reference_image: [] as string[],
  reference_video: '',
  reference_audio: '',
  image: '',
  audio: '',
  video: '',
}); // 输入文件：单个为字符串，参考图为数组

// ========== 服务商、模型 ==========

const allModels = ref<AiModelModelApi.Model[]>([]); // 全部视频模型
const typeModels = computed(() =>
  allModels.value.filter((item) =>
    isVideoModelOfType(formData.type, item.platform, item.model),
  ),
); // 当前创作类型可用的模型
const selectedModel = computed(() =>
  allModels.value.find((item) => item.id === formData.modelId),
);
const capability = computed(() =>
  getVideoModelCapability(
    selectedModel.value?.platform,
    selectedModel.value?.model,
    formData.mode,
    formData.duration,
    options.value.generateAudio,
  ),
);
const usesFirstFrame = computed(
  () =>
    formData.mode === AiVideoModeEnum.IMAGE ||
    formData.mode === AiVideoModeEnum.FIRST_LAST,
);

/** 切换创作类型：选中第一个模型（即第一个服务商的第一个模型） */
function handleTypeChange() {
  formData.modelId = typeModels.value[0]?.id;
  handleModelChange();
}

/** 切换模型：生成方式、参数重置为模型的默认值 */
function handleModelChange() {
  if (!capability.value.modes.includes(formData.mode)) {
    formData.mode = capability.value.modes[0]!;
  }
  let cap = capability.value; // 生成方式变化后，按新的方式重新计算
  formData.duration = cap.durations[0];
  options.value = {
    size: cap.sizes[0],
    quality: cap.fields.includes('quality') ? 'std' : undefined,
    promptExpansionMode: cap.fields.includes('promptExpansionMode')
      ? 'balanced'
      : undefined,
    // 万相 2.6：优化提示词默认开启（与服务端默认一致），镜头类型才生效
    promptExtend: cap.fields.includes('shotType') ? true : undefined,
  };
  cap = capability.value; // 可选分辨率与时长、生成音频有关，按重置后的值再计算
  formData.resolution = cap.resolutions[0];
  formData.ratio = cap.ratios[0];
}

/** 切换生成方式、时长、生成音频：分辨率、比例、时长不再可选的，重置为默认值 */
function handleModeChange() {
  const cap = capability.value;
  if (!cap.resolutions.includes(formData.resolution!)) {
    formData.resolution = cap.resolutions[0];
  }
  if (!cap.ratios.includes(formData.ratio!)) {
    formData.ratio = cap.ratios[0];
  }
  if (!cap.durations.includes(formData.duration!)) {
    formData.duration = cap.durations[0];
  }
}

// 海螺 10 秒只支持 768P，kling-2.6 生成音频只支持 1080p：时长、生成音频变化后，可选分辨率随之变化
watch(
  () => [formData.duration, options.value.generateAudio],
  handleModeChange,
);

// ========== 提交 ==========

/** 构建输入文件：只提交当前类型、方式使用的角色 */
function buildInputUrls() {
  const result: Record<string, string[]> = {};
  const { referenceVideo, referenceAudio } = capability.value;
  getVideoInputRoles(formData.type, formData.mode).forEach((role) => {
    // 切换模型后，已隐藏的参考视频、参考音频不提交
    if (
      (role === 'reference_video' && !referenceVideo) ||
      (role === 'reference_audio' && !referenceAudio)
    ) {
      return;
    }
    const value = (inputs as Record<string, string | string[]>)[role] ?? '';
    // 单张上传返回字符串，多张上传返回数组
    const urls = Array.isArray(value) ? value : value.split(',');
    const validUrls = urls.filter((url) => !!url);
    if (validUrls.length > 0) {
      result[role] = validUrls;
    }
  });
  return result;
}

/** 构建生成参数：只提交模型、生成方式支持的，切换后不适用的、清空的都不提交 */
function buildOptions(): AiVideoApi.VideoOptions {
  const fields = capability.value.fields;
  return Object.fromEntries(
    Object.entries(options.value).filter(
      ([key, value]) =>
        fields.includes(key) &&
        value !== undefined &&
        value !== null &&
        value !== '' &&
        // 镜头类型只在优化提示词开启时生效：明确关闭时不提交
        !(key === 'shotType' && options.value.promptExtend === false),
    ),
  );
}

/** 校验必填的输入文件：参数的取值范围由服务端按模型校验 */
function validateInputs(inputUrls: Record<string, string[]>) {
  if (formData.type === AiVideoTypeEnum.AVATAR) {
    if (!inputUrls.image) {
      return '请上传人物图片';
    }
    return inputUrls.audio ? undefined : '请上传驱动音频';
  }
  if (formData.type === AiVideoTypeEnum.MOTION) {
    if (!inputUrls.image) {
      return '请上传人物图片';
    }
    return inputUrls.video ? undefined : '请上传动作视频';
  }
  if (usesFirstFrame.value && !inputUrls.first_frame) {
    return '请上传首帧图片';
  }
  if (formData.mode === AiVideoModeEnum.FIRST_LAST && !inputUrls.last_frame) {
    return '请上传尾帧图片';
  }
  if (
    formData.mode === AiVideoModeEnum.REFERENCE &&
    !inputUrls.reference_image &&
    !inputUrls.reference_video &&
    !inputUrls.reference_audio
  ) {
    return '请上传参考素材';
  }
  return undefined;
}

/** 前端只校验必填，参数的取值范围由服务端按模型校验 */
function validate(inputUrls: Record<string, string[]>) {
  if (!formData.modelId) {
    return '请选择模型';
  }
  if (capability.value.promptRequired && !formData.prompt.trim()) {
    return '请输入提示词';
  }
  return validateInputs(inputUrls);
}

/** 提交生成 */
async function handleSubmit() {
  const inputUrls = buildInputUrls();
  const error = validate(inputUrls);
  if (error) {
    message.warning(error);
    return;
  }
  submitting.value = true;
  try {
    await generateVideo({
      type: formData.type,
      mode:
        formData.type === AiVideoTypeEnum.GENERATE ? formData.mode : undefined,
      modelId: formData.modelId!,
      prompt:
        formData.type === AiVideoTypeEnum.MOTION ? undefined : formData.prompt,
      resolution: formData.resolution,
      ratio: formData.ratio,
      duration: formData.duration,
      options: buildOptions(),
      inputUrls,
    });
    message.success('任务已提交，生成完成后会出现在我的作品中');
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

// ========== 做同款 ==========

/** 做同款：带回类型、模型、生成方式、提示词与参数，不带回输入文件；不再可选的参数重置为默认值 */
function applySame(video: AiVideoApi.Video) {
  formData.type = video.type;
  const model = allModels.value.find((item) => item.id === video.modelId);
  if (model) {
    formData.modelId = model.id;
  } else {
    handleTypeChange();
    message.warning('原模型已不可用，已切换为其它模型');
  }
  handleModelChange();
  if (video.mode && capability.value.modes.includes(video.mode)) {
    formData.mode = video.mode;
  }
  formData.prompt = video.prompt || '';
  if (model) {
    formData.resolution = video.resolution;
    formData.ratio = video.ratio;
    formData.duration = video.duration;
    options.value = { ...video.options };
    // 历史记录未传优化提示词时，服务端按开启处理；开关同步显示为开启
    if (
      capability.value.fields.includes('shotType') &&
      options.value.promptExtend === undefined
    ) {
      options.value.promptExtend = true;
    }
  }
  handleModeChange();
  Object.assign(inputs, {
    first_frame: '',
    last_frame: '',
    reference_image: [],
    reference_video: '',
    reference_audio: '',
    image: '',
    audio: '',
    video: '',
  });
}

defineExpose({ applySame });

/** 初始化：加载视频模型 */
onMounted(async () => {
  allModels.value = await getModelSimpleList(AiModelTypeEnum.VIDEO);
  handleTypeChange();
});
</script>

<template>
  <!-- 纵向 flex：表单区自己滚动，生成按钮在底部单独一行 -->
  <Card
    class="h-full w-full"
    :body-style="{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: '8px',
    }"
  >
    <Tabs
      v-model:active-key="formData.type"
      class="flex-shrink-0"
      @change="handleTypeChange"
    >
      <TabPane :key="AiVideoTypeEnum.GENERATE" tab="视频生成" />
      <TabPane :key="AiVideoTypeEnum.AVATAR" tab="数字人口播" />
      <TabPane :key="AiVideoTypeEnum.MOTION" tab="动作模仿" />
    </Tabs>
    <Form
      :model="formData"
      layout="vertical"
      class="min-h-0 flex-1 overflow-y-auto pr-1"
    >
      <ModelSelect
        v-model="formData.modelId"
        :models="typeModels"
        @change="handleModelChange"
      />

      <!-- 视频生成：生成方式与对应的输入 -->
      <template v-if="formData.type === AiVideoTypeEnum.GENERATE">
        <FormItem label="生成方式">
          <RadioGroup
            v-model:value="formData.mode"
            button-style="solid"
            @change="handleModeChange"
          >
            <RadioButton
              v-for="item in AI_VIDEO_MODE_OPTIONS"
              :key="item.value"
              :value="item.value"
              :disabled="!capability.modes.includes(item.value)"
            >
              {{ item.label }}
            </RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem
          v-if="usesFirstFrame"
          :label="
            formData.mode === AiVideoModeEnum.IMAGE ? '首帧图片' : '首帧 / 尾帧'
          "
        >
          <div class="flex gap-2">
            <ImageUpload
              v-model:value="inputs.first_frame"
              :max-size="IMAGE_MAX_MB"
              :accept="IMAGE_ACCEPT"
              :show-description="false"
              directory="ai/video"
            />
            <ImageUpload
              v-if="formData.mode === AiVideoModeEnum.FIRST_LAST"
              v-model:value="inputs.last_frame"
              :max-size="IMAGE_MAX_MB"
              :accept="IMAGE_ACCEPT"
              :show-description="false"
              directory="ai/video"
            />
          </div>
        </FormItem>
        <template v-if="formData.mode === AiVideoModeEnum.REFERENCE">
          <FormItem
            :label="`参考图（最多 ${capability.maxReferenceImages} 张）`"
          >
            <ImageUpload
              v-model:value="inputs.reference_image"
              :max-number="capability.maxReferenceImages || 1"
              :max-size="IMAGE_MAX_MB"
              :accept="IMAGE_ACCEPT"
              :show-description="false"
              directory="ai/video"
              multiple
            />
          </FormItem>
          <FormItem v-if="capability.referenceVideo" label="参考视频">
            <FileUpload
              v-model:value="inputs.reference_video"
              :accept="['mp4', 'mov']"
              :max-size="50"
              directory="ai/video"
            />
          </FormItem>
          <FormItem v-if="capability.referenceAudio" label="参考音频">
            <FileUpload
              v-model:value="inputs.reference_audio"
              :accept="['mp3', 'wav']"
              :max-size="15"
              directory="ai/video"
            />
          </FormItem>
        </template>
      </template>

      <!-- 数字人口播、动作模仿：人物图片 + 驱动音频 / 动作视频 -->
      <template v-else>
        <FormItem label="人物图片">
          <ImageUpload
            v-model:value="inputs.image"
            :max-size="IMAGE_MAX_MB"
            :accept="IMAGE_ACCEPT"
            :show-description="false"
            directory="ai/video"
          />
        </FormItem>
        <FormItem
          v-if="formData.type === AiVideoTypeEnum.AVATAR"
          label="驱动音频"
          extra="上传口播音频，时长限制以所选模型为准"
        >
          <FileUpload
            v-model:value="inputs.audio"
            :accept="['mp3', 'wav']"
            :max-size="15"
            directory="ai/video"
          />
        </FormItem>
        <FormItem
          v-else
          label="动作视频"
          extra="人物将模仿视频中的动作，时长限制以所选模型为准（例如 30 秒内）"
        >
          <FileUpload
            v-model:value="inputs.video"
            :accept="['mp4', 'mov']"
            :max-size="50"
            directory="ai/video"
          />
        </FormItem>
      </template>

      <FormItem
        v-if="formData.type !== AiVideoTypeEnum.MOTION"
        label="提示词"
        :required="capability.promptRequired"
      >
        <Textarea
          v-model:value="formData.prompt"
          :rows="4"
          :maxlength="2000"
          show-count
          :placeholder="
            formData.type === AiVideoTypeEnum.AVATAR
              ? '可选：描述人物动作、表情或镜头'
              : '描述画面内容、动作与镜头，例如：一只橘猫在雨夜的霓虹街头奔跑，镜头跟随'
          "
        />
      </FormItem>

      <!-- 参数 -->
      <ParamsForm
        v-model:resolution="formData.resolution"
        v-model:ratio="formData.ratio"
        v-model:duration="formData.duration"
        v-model:options="options"
        :type="formData.type"
        :capability="capability"
      />
    </Form>

    <!-- 生成按钮：在表单区下方单独占一行，不随表单滚动 -->
    <div class="flex-shrink-0 pt-3">
      <Button
        type="primary"
        size="large"
        block
        :loading="submitting"
        @click="handleSubmit"
      >
        开始生成
      </Button>
      <div class="mt-1.5 text-xs leading-[18px] text-gray-500">
        生成为异步任务，通常需要几分钟；完成后会转存到文件服务并出现在「我的作品」中
      </div>
    </div>
  </Card>
</template>
