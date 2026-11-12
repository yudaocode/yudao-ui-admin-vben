<script lang="ts" setup>
import type { AiImageApi } from '#/api/ai/image';
import type { AiModelModelApi } from '#/api/ai/model/model';

import { computed, ref } from 'vue';

import {
  AiImageInputRoleEnum,
  AiImageModeEnum,
  ImageHotEnglishWords,
} from '@vben/constants';

import {
  Button,
  Checkbox,
  Collapse,
  CollapsePanel,
  Form,
  FormItem,
  InputNumber,
  message,
  RadioButton,
  RadioGroup,
  Slider,
  Switch,
  Tag,
  TextArea,
} from 'antdv-next';

import {
  midjourneyBlend,
  midjourneyImagine,
  midjourneySwapFace,
  optimizePrompt,
} from '#/api/ai/image';
import { ImageUpload } from '#/components/upload';
import {
  buildMidjourneyPrompt,
  getMjVersion,
  getMjVersionByFlag,
  MJ_ADAPTER,
  MJ_BLEND_DIMENSIONS,
  MJ_DEFAULT_VERSION,
  MJ_IMAGE_ACCEPT,
  MJ_IMAGE_MAX_MB,
  MJ_MODES,
  MJ_RATIOS,
  MJ_VERSIONS,
} from '#/views/ai/image/constants';

/** AI 绘图：Midjourney 的创作表单（五种模式；参数按版本门禁） */
defineOptions({ name: 'AiImageMidjourneyForm' });

const props = defineProps<{
  model: AiModelModelApi.Model;
}>();
const emit = defineEmits<{
  submitted: [];
}>();

const PROMPT_MAX = 1200; // 与 AiMidjourneyImagineReqVO.prompt 上限一致
const NEGATIVE_PROMPT_MAX = 2000;
const SEED_MAX = 4_294_967_295; // --seed 上限

const mode = ref<number>(AiImageModeEnum.MIDJOURNEY_IMAGINE); // 子模式
const formKey = ref(0); // 回填时重建上传组件，避免残留上一次的图片

/** 文生图、图生图、一致性的参数 */
function buildInitialFormData() {
  return {
    prompt: '',
    negativePrompt: '',
    aspectRatio: '1:1',
    quality: 0, // 0 表示默认：不发送 --q
    stylize: undefined as number | undefined,
    chaos: undefined as number | undefined,
    seed: -1 as number | undefined,
    tile: false,
    raw: false,
    hd: false,
    referenceImageUrls: [] as string[],
    imageWeight: 1,
    crefUrl: '',
    characterWeight: 100,
    srefUrl: '',
    styleWeight: 100,
    styleVersion: undefined as number | undefined,
  };
}
const formData = ref(buildInitialFormData());
const versionKey = ref(MJ_DEFAULT_VERSION);
const version = computed(() => getMjVersion(versionKey.value));
const styleVersionEnabled = ref(false); // 是否附加 --sv

/** 融图、换脸的参数 */
const blendImageUrls = ref<string[]>([]);
const dimensions = ref('SQUARE');
const swapSourceUrl = ref('');
const swapTargetUrl = ref('');

function getChipClass(active: boolean) {
  return active
    ? 'border-primary bg-primary/5'
    : 'border-border hover:border-primary';
}

/** 上传组件：单张时返回字符串，统一为数组 */
function toUrls(value: string | string[]): string[] {
  if (!value) {
    return [];
  }
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

/** 切换版本：清除新版本不支持的参数（不显示、不发送） */
function handleVersionChange(key: string) {
  versionKey.value = key;
  const current = version.value;
  const data = formData.value;
  if (data.quality && !current.quality.includes(data.quality)) {
    data.quality = 0;
  }
  if (!current.raw) {
    data.raw = false;
  }
  if (!current.hd) {
    data.hd = false;
  }
  data.imageWeight = current.iw
    ? Math.min(data.imageWeight, current.iw.max)
    : 1;
  if (!current.cref) {
    data.crefUrl = '';
  }
  if (current.sv) {
    data.styleVersion = current.sv.default;
  } else {
    styleVersionEnabled.value = false;
  }
}

/** 构建文生图、图生图、一致性的请求 */
function buildImagineReqVO(): AiImageApi.ImageMidjourneyImagineReqVO {
  const data = formData.value;
  const current = version.value;
  const isImage = mode.value === AiImageModeEnum.MIDJOURNEY_IMAGE;
  const isConsistency = mode.value === AiImageModeEnum.MIDJOURNEY_CONSISTENCY;
  const srefUrl = isConsistency && data.srefUrl ? data.srefUrl : undefined;
  const useCref = isConsistency && current.cref && !!data.crefUrl;
  return {
    modelId: props.model.id,
    mode: mode.value,
    prompt: data.prompt,
    negativePrompt: data.negativePrompt || undefined,
    version: current.flag,
    aspectRatio: data.aspectRatio,
    quality:
      current.quality.length > 0 && data.quality ? data.quality : undefined,
    stylize: data.stylize ?? undefined,
    chaos: data.chaos ?? undefined,
    seed: data.seed ?? -1,
    tile: data.tile,
    raw: current.raw ? data.raw : false,
    hd: current.hd ? data.hd : false,
    referenceImageUrls: isImage ? toUrls(data.referenceImageUrls) : undefined,
    imageWeight: isImage && current.iw ? data.imageWeight : undefined,
    crefUrl: useCref ? data.crefUrl : undefined,
    characterWeight: useCref ? data.characterWeight : undefined,
    srefUrl,
    styleWeight: srefUrl ? data.styleWeight : undefined,
    styleVersion:
      srefUrl && current.sv && styleVersionEnabled.value
        ? (data.styleVersion ?? current.sv.default)
        : undefined,
  };
}

/** 提交预览：与后端拼接的 finalPrompt 一致 */
const finalPrompt = computed(() => buildMidjourneyPrompt(buildImagineReqVO()));

/** 随机热词 */
function handleRandomHotWord() {
  formData.value.prompt = ImageHotEnglishWords[
    Math.floor(Math.random() * ImageHotEnglishWords.length)
  ] as string;
}

/** 生成专业绘画指令 */
const optimizing = ref(false);
async function handleOptimizePrompt() {
  if (!formData.value.prompt?.trim()) {
    message.warning('请先输入画面描述');
    return;
  }
  optimizing.value = true;
  try {
    const prompt = await optimizePrompt(formData.value.prompt);
    formData.value.prompt = prompt.slice(0, PROMPT_MAX);
  } finally {
    optimizing.value = false;
  }
}

/** 提交 */
const submitting = ref(false);
async function handleSubmit() {
  // 1. 校验各模式需要的图片
  const data = formData.value;
  if (mode.value === AiImageModeEnum.MIDJOURNEY_BLEND) {
    if (toUrls(blendImageUrls.value).length < 2) {
      message.warning('融图需要 2–5 张图片');
      return;
    }
  } else if (mode.value === AiImageModeEnum.MIDJOURNEY_SWAP_FACE) {
    if (!swapSourceUrl.value || !swapTargetUrl.value) {
      message.warning('请上传来源脸与目标图');
      return;
    }
  } else {
    if (!data.prompt?.trim()) {
      message.warning('请输入画面描述');
      return;
    }
    if (
      mode.value === AiImageModeEnum.MIDJOURNEY_IMAGE &&
      toUrls(data.referenceImageUrls).length === 0
    ) {
      message.warning('图生图至少需要 1 张参考图');
      return;
    }
    if (
      mode.value === AiImageModeEnum.MIDJOURNEY_CONSISTENCY &&
      !(version.value.cref && data.crefUrl) &&
      !data.srefUrl
    ) {
      message.warning('一致性至少需要 1 张角色或风格参考图');
      return;
    }
  }

  // 2. 按模式提交
  submitting.value = true;
  try {
    if (mode.value === AiImageModeEnum.MIDJOURNEY_BLEND) {
      await midjourneyBlend({
        modelId: props.model.id,
        imageUrls: toUrls(blendImageUrls.value),
        dimensions: dimensions.value,
      });
    } else if (mode.value === AiImageModeEnum.MIDJOURNEY_SWAP_FACE) {
      await midjourneySwapFace({
        modelId: props.model.id,
        sourceUrl: swapSourceUrl.value,
        targetUrl: swapTargetUrl.value,
      });
    } else {
      await midjourneyImagine(buildImagineReqVO());
    }
    message.success('已提交，生成结果见右侧我的作品');
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

/** 重新生成：按原记录的模式回填 */
function setValues(image: AiImageApi.Image) {
  const getImageUrls = (role: string) =>
    (image.inputImages || [])
      .filter((item) => item.role === role)
      .map((item) => item.url);
  const isRegenerateMode = MJ_MODES.some((item) => item.mode === image.mode);
  mode.value = isRegenerateMode
    ? image.mode
    : AiImageModeEnum.MIDJOURNEY_IMAGINE;
  formKey.value++;
  const options = image.midjourneyOptions || {};
  if (mode.value === AiImageModeEnum.MIDJOURNEY_BLEND) {
    blendImageUrls.value = getImageUrls(AiImageInputRoleEnum.BLEND);
    dimensions.value = options.dimensions || 'SQUARE';
    return;
  }
  if (mode.value === AiImageModeEnum.MIDJOURNEY_SWAP_FACE) {
    swapSourceUrl.value =
      getImageUrls(AiImageInputRoleEnum.SWAP_SOURCE)[0] || '';
    swapTargetUrl.value =
      getImageUrls(AiImageInputRoleEnum.SWAP_TARGET)[0] || '';
    return;
  }
  // 文生图、图生图、一致性：版本不在常量中时使用默认版本
  versionKey.value =
    getMjVersionByFlag(options.version)?.key || MJ_DEFAULT_VERSION;
  const data = buildInitialFormData();
  data.prompt = image.prompt;
  data.negativePrompt = image.negativePrompt || '';
  if (options.aspectRatio && MJ_RATIOS.includes(options.aspectRatio)) {
    data.aspectRatio = options.aspectRatio;
  }
  data.quality = options.quality ?? 0;
  data.stylize = options.stylize ?? undefined;
  data.chaos = options.chaos ?? undefined;
  data.seed = options.seed ?? -1;
  data.tile = !!options.tile;
  data.raw = !!options.raw;
  data.hd = !!options.hd;
  data.referenceImageUrls = getImageUrls(AiImageInputRoleEnum.REFERENCE).slice(
    0,
    5,
  );
  data.imageWeight = options.imageWeight ?? 1;
  data.crefUrl = getImageUrls(AiImageInputRoleEnum.CREF)[0] || '';
  data.characterWeight = options.characterWeight ?? 100;
  data.srefUrl = getImageUrls(AiImageInputRoleEnum.SREF)[0] || '';
  data.styleWeight = options.styleWeight ?? 100;
  data.styleVersion = options.styleVersion ?? undefined;
  styleVersionEnabled.value =
    options.styleVersion !== undefined && options.styleVersion !== null;
  formData.value = data;
  // 回填后按版本清除不支持的参数
  handleVersionChange(versionKey.value);
  if (styleVersionEnabled.value) {
    formData.value.styleVersion = options.styleVersion;
  }
}

defineExpose({ setValues });
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- 参数区单独滚动；生成按钮在下方独占一行 -->
    <Form
      :key="formKey"
      layout="vertical"
      class="min-h-0 flex-1 overflow-y-auto pr-1"
    >
      <!-- 模式 -->
      <FormItem label="模式">
        <RadioGroup v-model:value="mode" button-style="solid">
          <RadioButton
            v-for="item in MJ_MODES"
            :key="item.mode"
            :value="item.mode"
          >
            {{ item.name }}
          </RadioButton>
        </RadioGroup>
      </FormItem>

      <!-- 融图 -->
      <template v-if="mode === AiImageModeEnum.MIDJOURNEY_BLEND">
        <FormItem label="融图图片（2–5 张）">
          <ImageUpload
            v-model:value="blendImageUrls"
            :max-number="5"
            :max-size="MJ_IMAGE_MAX_MB"
            :accept="MJ_IMAGE_ACCEPT"
            :show-description="false"
            directory="ai/image"
            multiple
          />
        </FormItem>
        <FormItem label="尺寸">
          <RadioGroup v-model:value="dimensions" button-style="solid">
            <RadioButton
              v-for="item in MJ_BLEND_DIMENSIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </RadioButton>
          </RadioGroup>
        </FormItem>
      </template>

      <!-- 换脸 -->
      <template v-else-if="mode === AiImageModeEnum.MIDJOURNEY_SWAP_FACE">
        <div class="flex gap-4">
          <FormItem label="来源脸">
            <ImageUpload
              v-model:value="swapSourceUrl"
              :max-size="MJ_IMAGE_MAX_MB"
              :accept="MJ_IMAGE_ACCEPT"
              :show-description="false"
              directory="ai/image"
            />
          </FormItem>
          <FormItem label="目标图">
            <ImageUpload
              v-model:value="swapTargetUrl"
              :max-size="MJ_IMAGE_MAX_MB"
              :accept="MJ_IMAGE_ACCEPT"
              :show-description="false"
              directory="ai/image"
            />
          </FormItem>
        </div>
        <div class="mb-4 text-xs text-gray-500">
          把来源脸换到目标图上；换脸结果没有 U / V 按钮
        </div>
      </template>

      <!-- 文生图、图生图、一致性 -->
      <template v-else>
        <FormItem label="画面描述">
          <TextArea
            v-model:value="formData.prompt"
            :rows="5"
            :maxlength="PROMPT_MAX"
            show-count
            placeholder="例如：a cinematic shot of an ancient Chinese city at night"
          />
          <div class="mt-2 flex w-full flex-wrap items-center gap-1.5">
            <Button
              size="small"
              type="primary"
              ghost
              :loading="optimizing"
              @click="handleOptimizePrompt"
            >
              生成专业绘画指令
            </Button>
            <Button size="small" @click="handleRandomHotWord">随机热词</Button>
            <Tag
              v-for="hotWord in ImageHotEnglishWords"
              :key="hotWord"
              class="!mr-0 cursor-pointer"
              @click="formData.prompt = hotWord"
            >
              {{ hotWord }}
            </Tag>
          </div>
        </FormItem>
        <FormItem label="不希望出现的内容（--no）">
          <TextArea
            v-model:value="formData.negativePrompt"
            :rows="2"
            :maxlength="NEGATIVE_PROMPT_MAX"
            show-count
            placeholder="例如：text, watermark"
          />
        </FormItem>

        <!-- 图生图：参考图 -->
        <FormItem
          v-if="mode === AiImageModeEnum.MIDJOURNEY_IMAGE"
          label="参考图（1–5 张）"
        >
          <ImageUpload
            v-model:value="formData.referenceImageUrls"
            :max-number="5"
            :max-size="MJ_IMAGE_MAX_MB"
            :accept="MJ_IMAGE_ACCEPT"
            :show-description="false"
            directory="ai/image"
            multiple
          />
        </FormItem>

        <!-- 版本 -->
        <FormItem label="版本">
          <div class="grid w-full grid-cols-2 gap-2">
            <div
              v-for="item in MJ_VERSIONS"
              :key="item.key"
              class="flex cursor-pointer flex-col gap-0.5 rounded-md border border-solid px-2.5 py-1.5 leading-[18px]"
              :class="getChipClass(versionKey === item.key)"
              @click="handleVersionChange(item.key)"
            >
              <span class="font-bold">{{ item.name }}</span>
              <span class="text-xs text-gray-500">{{ item.badge }}</span>
            </div>
          </div>
        </FormItem>

        <!-- 比例 -->
        <FormItem label="比例">
          <RadioGroup
            v-model:value="formData.aspectRatio"
            button-style="solid"
            size="small"
          >
            <RadioButton v-for="ratio in MJ_RATIOS" :key="ratio" :value="ratio">
              {{ ratio }}
            </RadioButton>
          </RadioGroup>
        </FormItem>

        <!-- 图生图：图片权重 -->
        <FormItem
          v-if="mode === AiImageModeEnum.MIDJOURNEY_IMAGE"
          label="图片权重（--iw）"
        >
          <div v-if="version.iw" class="flex w-full items-center gap-3">
            <Slider
              v-model:value="formData.imageWeight"
              :min="version.iw.min"
              :max="version.iw.max"
              :step="0.1"
              class="flex-1"
            />
            <InputNumber
              v-model:value="formData.imageWeight"
              :min="version.iw.min"
              :max="version.iw.max"
              :step="0.1"
              class="!w-[90px]"
            />
          </div>
          <div v-else class="text-xs text-gray-500">
            {{ version.why?.iw }}
          </div>
        </FormItem>

        <!-- 一致性：角色参考、风格参考 -->
        <template v-if="mode === AiImageModeEnum.MIDJOURNEY_CONSISTENCY">
          <FormItem label="角色参考（--cref）">
            <template v-if="version.cref">
              <ImageUpload
                v-model:value="formData.crefUrl"
                :max-size="MJ_IMAGE_MAX_MB"
                :accept="MJ_IMAGE_ACCEPT"
                :show-description="false"
                directory="ai/image"
              />
              <div class="text-xs">角色权重（--cw）</div>
              <div class="flex w-full items-center gap-3">
                <Slider
                  v-model:value="formData.characterWeight"
                  :min="0"
                  :max="100"
                  class="flex-1"
                />
                <InputNumber
                  v-model:value="formData.characterWeight"
                  :min="0"
                  :max="100"
                  class="!w-[90px]"
                />
              </div>
            </template>
            <div v-else class="text-xs text-gray-500">
              {{
                version.why?.cref ||
                '--cref 是旧版角色参考，仅 V6.1、Niji 6 可用'
              }}
            </div>
          </FormItem>
          <FormItem label="风格参考（--sref）">
            <ImageUpload
              v-model:value="formData.srefUrl"
              :max-size="MJ_IMAGE_MAX_MB"
              :accept="MJ_IMAGE_ACCEPT"
              :show-description="false"
              directory="ai/image"
            />
            <div class="text-xs">风格权重（--sw）</div>
            <div class="flex w-full items-center gap-3">
              <Slider
                v-model:value="formData.styleWeight"
                :min="0"
                :max="1000"
                class="flex-1"
              />
              <InputNumber
                v-model:value="formData.styleWeight"
                :min="0"
                :max="1000"
                class="!w-[90px]"
              />
            </div>
            <div v-if="version.sv" class="flex w-full items-center">
              <Checkbox
                v-if="version.sv.min === version.sv.max"
                v-model:checked="styleVersionEnabled"
              >
                附加 --sv {{ version.sv.min }}
              </Checkbox>
              <template v-else>
                <Checkbox v-model:checked="styleVersionEnabled">
                  风格版本（--sv）
                </Checkbox>
                <InputNumber
                  v-if="styleVersionEnabled"
                  v-model:value="formData.styleVersion"
                  :min="version.sv.min"
                  :max="version.sv.max"
                  class="ml-2 !w-[120px]"
                />
              </template>
            </div>
          </FormItem>
          <!-- 官方新能力：中转未适配，禁用并说明 -->
          <div
            v-if="version.omni"
            class="mb-3 rounded-md border border-dashed border-border p-2.5 text-xs leading-[18px] text-gray-500"
          >
            <div class="font-bold">
              Omni Reference（--oref / --ow）· 暂不可用
            </div>
            {{ MJ_ADAPTER.omniReference.reason }}
          </div>
          <div
            v-if="version.edit"
            class="mb-3 rounded-md border border-dashed border-border p-2.5 text-xs leading-[18px] text-gray-500"
          >
            <div class="font-bold">V8 Edit（--edit）· 暂不可用</div>
            {{ MJ_ADAPTER.edit.reason }}
          </div>
        </template>

        <!-- 按版本的参数 -->
        <Collapse class="mb-4">
          <CollapsePanel key="more" header="更多参数">
            <FormItem v-if="version.quality.length > 0" label="画质（--q）">
              <RadioGroup v-model:value="formData.quality" button-style="solid">
                <RadioButton :value="0">默认</RadioButton>
                <RadioButton
                  v-for="quality in version.quality"
                  :key="quality"
                  :value="quality"
                >
                  {{ quality }}
                </RadioButton>
              </RadioGroup>
            </FormItem>
            <div class="flex flex-wrap gap-x-6">
              <FormItem label="平铺（--tile）">
                <Switch v-model:checked="formData.tile" />
              </FormItem>
              <FormItem v-if="version.raw" label="RAW（--raw）">
                <Switch v-model:checked="formData.raw" />
              </FormItem>
              <FormItem v-if="version.hd" label="HD（--hd）">
                <Switch
                  v-model:checked="formData.hd"
                  checked-children="HD"
                  un-checked-children="SD"
                />
              </FormItem>
            </div>
            <FormItem label="创意度（--c，0–100）">
              <InputNumber
                v-model:value="formData.chaos"
                :min="0"
                :max="100"
                placeholder="默认"
                class="!w-full"
              />
            </FormItem>
            <FormItem label="风格化（--s，0–1000）">
              <InputNumber
                v-model:value="formData.stylize"
                :min="0"
                :max="1000"
                placeholder="默认"
                class="!w-full"
              />
            </FormItem>
            <FormItem label="随机种子（--seed，-1 表示随机）">
              <InputNumber
                v-model:value="formData.seed"
                :min="-1"
                :max="SEED_MAX"
                class="!w-full"
              />
            </FormItem>
            <div class="text-xs leading-[18px] text-gray-500">
              <div v-for="(reason, key) in version.why" :key="key">
                {{ reason }}
              </div>
            </div>
          </CollapsePanel>
        </Collapse>

        <!-- 提交预览 -->
        <div
          class="mb-4 break-all rounded-md bg-gray-50 p-2.5 text-xs leading-[18px] dark:bg-gray-800"
        >
          <div class="mb-1 text-gray-500">提交预览</div>
          {{ finalPrompt }}
        </div>
      </template>
    </Form>
    <!-- 生成按钮：在参数区下方独占一行，不随参数滚动 -->
    <div class="flex-shrink-0 pt-3">
      <Button
        type="primary"
        size="large"
        block
        :loading="submitting"
        @click="handleSubmit"
      >
        生成图片
      </Button>
    </div>
  </div>
</template>
