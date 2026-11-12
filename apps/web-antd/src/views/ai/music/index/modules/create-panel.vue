<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';
import type { UploadRequestOption } from 'ant-design-vue/lib/vc-upload/interface';

import type { AiModelModelApi } from '#/api/ai/model/model';
import type { AiMusicApi } from '#/api/ai/music';

import { computed, nextTick, onMounted, reactive, ref } from 'vue';

import {
  AiModelTypeEnum,
  AiMusicGenerateModeEnum,
  AiPlatformEnum,
  MusicPresetTags,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import {
  Avatar,
  Button,
  Card,
  Divider,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  RadioButton,
  RadioGroup,
  Select,
  Spin,
  Switch,
  Tag,
  Textarea,
  Upload,
} from 'ant-design-vue';

import { getModelSimpleList } from '#/api/ai/model/model';
import {
  extendMusic,
  generateLyric,
  generateMusic,
  uploadMusic,
} from '#/api/ai/music';
import { useUpload } from '#/components/upload/use-upload';
import { formatMusicDuration, getMusicTitle } from '#/views/ai/utils/format';

/** AI 音乐：左侧创作面板（灵感、自定义、续写、上传） */
defineOptions({ name: 'AiMusicCreatePanel' });

const emit = defineEmits<{
  submitted: []; // 提交成功，用于刷新作品列表
}>();

const MAX_UPLOAD_MB = 50; // 上传音频的大小上限

const formRef = ref(); // 表单 Ref
const formData = reactive({
  generateMode: AiMusicGenerateModeEnum.INSPIRATION,
  modelId: undefined as number | undefined,
  makeInstrumental: false,
  prompt: '',
  lyric: '',
  tags: '',
  title: '',
  extendSeconds: undefined as number | undefined,
});
const extendSource = ref<AiMusicApi.Music>(); // 续写来源；为空表示普通创作
const isInspiration = computed(
  () =>
    !extendSource.value &&
    formData.generateMode === AiMusicGenerateModeEnum.INSPIRATION,
);

/** 续写起点：不能超过原曲时长。只在字段下提示，不弹全局消息 */
async function validateExtendSeconds(_rule: Rule, value?: null | number) {
  if (value === undefined || value === null) {
    throw new Error('请输入续写起点');
  }
  const duration = extendSource.value?.duration;
  if (duration !== undefined && duration !== null && value > duration) {
    throw new Error('续写起点不能超过原曲时长');
  }
}

/** 表单规则：显式声明返回类型，避免各分支的对象字面量推断成带可选 undefined 属性的联合类型 */
const formRules = computed((): Record<string, Rule[]> => {
  if (extendSource.value) {
    return {
      extendSeconds: [
        { validator: validateExtendSeconds, trigger: ['blur', 'change'] },
      ],
      title: [{ required: true, message: '请输入歌曲名称', trigger: 'blur' }],
    };
  }
  if (isInspiration.value) {
    return {
      modelId: [{ required: true, message: '请选择模型', trigger: 'change' }],
      prompt: [{ required: true, message: '请输入歌曲描述', trigger: 'blur' }],
    };
  }
  return {
    modelId: [{ required: true, message: '请选择模型', trigger: 'change' }],
    lyric: formData.makeInstrumental
      ? []
      : [{ required: true, message: '请输入歌词', trigger: 'blur' }],
    title: [{ required: true, message: '请输入歌曲名称', trigger: 'blur' }],
  };
});

// ========== 模型 ==========

const models = ref<AiModelModelApi.Model[]>([]); // 音乐模型列表
const modelOptions = computed(() =>
  models.value.map((item) => ({
    label: item.name,
    value: item.id,
    iconUrl: item.iconUrl,
    description: item.description,
  })),
);

/** 加载模型列表：默认选中第一个 */
async function loadModels() {
  models.value = await getModelSimpleList(
    AiModelTypeEnum.MUSIC,
    AiPlatformEnum.SUNO,
  );
  if (!formData.modelId && models.value.length > 0) {
    formData.modelId = models.value[0]!.id;
  }
}

// ========== 音乐风格 ==========

/** 拆分已输入的音乐风格 */
function splitTags() {
  return formData.tags
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/** 是否已选中预置风格 */
function hasTag(value: string) {
  return splitTags().includes(value);
}

/** 点选预置风格：追加或移除 */
function handleTagClick(value: string) {
  const tags = splitTags();
  const index = tags.indexOf(value);
  if (index === -1) {
    tags.push(value);
  } else {
    tags.splice(index, 1);
  }
  const joined = tags.join(', ');
  if (joined.length > 120) {
    message.warning('音乐风格不能超过 120 个字符');
    return;
  }
  formData.tags = joined;
}

// ========== 歌词 ==========

const lyricLoading = ref(false);

/** AI 生成歌词：歌词框内容作为主题，返回的第一行作为名称 */
async function handleGenerateLyric() {
  const prompt = formData.lyric.trim();
  if (!prompt) {
    message.warning('请先在歌词框输入歌词主题');
    return;
  }
  lyricLoading.value = true;
  try {
    const data = await generateLyric(prompt);
    formData.lyric = (data.lyric || '').slice(0, 1024);
    if (data.title) {
      formData.title = data.title.slice(0, 100);
    }
    message.success('歌词生成成功');
  } finally {
    lyricLoading.value = false;
  }
}

// ========== 提交 ==========

const submitting = ref(false);

/** 提交创作或续写 */
async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch (error: any) {
    // 普通创作补一条全局提示；续写只在字段下提示
    const first = error?.errorFields?.[0]?.errors?.[0];
    if (!extendSource.value && first) {
      message.error(first);
    }
    return;
  }
  submitting.value = true;
  try {
    if (extendSource.value) {
      await extendMusic({
        id: extendSource.value.id,
        extendSeconds: formData.extendSeconds!,
        lyric: formData.lyric || undefined,
        tags: formData.tags || undefined,
        title: formData.title,
      });
      message.success('续写任务已提交');
      cancelExtend();
    } else if (isInspiration.value) {
      await generateMusic({
        generateMode: AiMusicGenerateModeEnum.INSPIRATION,
        modelId: formData.modelId!,
        prompt: formData.prompt,
        makeInstrumental: formData.makeInstrumental,
      });
      message.success('创作任务已提交');
    } else {
      await generateMusic({
        generateMode: AiMusicGenerateModeEnum.CUSTOM,
        modelId: formData.modelId!,
        lyric: formData.makeInstrumental ? undefined : formData.lyric,
        tags: formData.tags || undefined,
        title: formData.title,
        makeInstrumental: formData.makeInstrumental,
      });
      message.success('创作任务已提交');
    }
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

// ========== 续写 ==========

/** 设置续写来源：起点默认原曲时长，名称、风格沿用原曲 */
function setExtendSource(music: AiMusicApi.Music) {
  extendSource.value = music;
  formData.extendSeconds =
    music.duration === undefined || music.duration === null
      ? 0
      : Math.floor(music.duration);
  formData.lyric = '';
  formData.tags = music.tags ? music.tags.slice(0, 120) : '';
  formData.title = getMusicTitle(music.title).slice(0, 100);
  nextTick(() => formRef.value?.clearValidate());
}

/** 取消续写，回到普通创作 */
function cancelExtend() {
  extendSource.value = undefined;
  formData.extendSeconds = undefined;
  nextTick(() => formRef.value?.clearValidate());
}

defineExpose({ setExtendSource });

// ========== 上传 ==========

const uploading = ref(false);
const { httpRequest } = useUpload('ai/music');

/** 上传前校验：模型、格式、大小 */
function beforeUpload(file: File) {
  if (!formData.modelId) {
    message.warning('请先选择模型');
    return false;
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'mp3' && ext !== 'wav') {
    message.error('只支持 mp3、wav 格式的音频');
    return false;
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    message.error(`音频大小不能超过 ${MAX_UPLOAD_MB}MB`);
    return false;
  }
  return true;
}

/** 上传音频：先上传到文件服务，再提交上传任务 */
async function handleUpload(options: UploadRequestOption) {
  const file = options.file as File;
  const name = file.name.replace(/\.[^.]+$/, '');
  uploading.value = true;
  try {
    // 前端直传时返回 { url }，后端上传时直接返回地址
    const res: any = await httpRequest(file);
    await uploadMusic({
      modelId: formData.modelId!,
      fileUrl: res?.url || res,
      title: name ? name.slice(0, 100) : undefined,
    });
    options.onSuccess?.({});
    message.success('歌曲上传成功，正在处理');
    emit('submitted');
  } catch (error) {
    // 失败原因已由请求拦截器提示
    options.onError?.(error as Error);
  } finally {
    uploading.value = false;
  }
}

onMounted(() => {
  loadModels();
});
</script>

<template>
  <Card
    class="h-full w-full"
    :body-style="{ height: '100%', overflowY: 'auto' }"
  >
    <Spin :spinning="uploading" tip="音频上传中...">
      <Form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
      >
        <!-- 续写来源 -->
        <template v-if="extendSource">
          <div class="mb-3 flex items-center justify-between">
            <span class="text-base font-bold">续写歌曲</span>
            <Button type="link" size="small" @click="cancelExtend">
              <template #icon>
                <IconifyIcon icon="lucide:x" class="mr-1 inline-block" />
              </template>
              取消续写
            </Button>
          </div>
          <div
            class="mb-4 flex items-center gap-2.5 rounded-md bg-gray-50 p-2.5 dark:bg-gray-800"
          >
            <Avatar
              shape="square"
              :size="48"
              :src="extendSource.coverUrl || undefined"
              class="flex-shrink-0"
            >
              <template #icon>
                <IconifyIcon
                  icon="lucide:headphones"
                  class="inline-block align-middle"
                />
              </template>
            </Avatar>
            <div class="min-w-0 flex-1">
              <div class="truncate font-bold">
                {{ getMusicTitle(extendSource.title) }}
              </div>
              <div class="text-xs text-gray-500">
                {{ extendSource.model }} · 时长
                {{ formatMusicDuration(extendSource.duration) }}
              </div>
            </div>
          </div>
          <FormItem
            label="续写起点（秒）"
            name="extendSeconds"
            extra="从原曲该时间点开始续写，默认原曲结尾；模型与渠道沿用原曲"
          >
            <InputNumber
              v-model:value="formData.extendSeconds"
              :min="0"
              :precision="0"
              class="!w-full"
            />
          </FormItem>
        </template>

        <!-- 创作模式、模型 -->
        <template v-else>
          <FormItem label="创作模式" name="generateMode">
            <RadioGroup
              v-model:value="formData.generateMode"
              button-style="solid"
            >
              <RadioButton :value="AiMusicGenerateModeEnum.INSPIRATION">
                灵感模式
              </RadioButton>
              <RadioButton :value="AiMusicGenerateModeEnum.CUSTOM">
                自定义模式
              </RadioButton>
            </RadioGroup>
          </FormItem>
          <FormItem label="模型" name="modelId">
            <Select
              v-model:value="formData.modelId"
              :options="modelOptions"
              placeholder="请选择音乐模型"
              show-search
              option-filter-prop="label"
              class="w-full"
            >
              <!-- 带简介的选项为两行 -->
              <template #option="{ label, iconUrl, description }">
                <div class="flex items-center gap-2 overflow-hidden">
                  <Avatar
                    shape="square"
                    :size="24"
                    :src="iconUrl || undefined"
                    class="flex-shrink-0"
                  >
                    <template #icon>
                      <IconifyIcon
                        icon="lucide:cpu"
                        class="inline-block align-middle"
                      />
                    </template>
                  </Avatar>
                  <div class="min-w-0 flex-1 overflow-hidden">
                    <div class="truncate leading-[18px]">{{ label }}</div>
                    <div
                      v-if="description"
                      class="truncate text-xs leading-4 text-gray-500"
                      :title="description"
                    >
                      {{ description }}
                    </div>
                  </div>
                </div>
              </template>
            </Select>
          </FormItem>
          <FormItem label="纯音乐" name="makeInstrumental">
            <Switch v-model:checked="formData.makeInstrumental" />
            <span class="ml-2 text-xs text-gray-500">
              开启后生成不带人声的音乐
            </span>
          </FormItem>
        </template>

        <!-- 灵感模式：歌曲描述 -->
        <FormItem v-if="isInspiration" label="歌曲描述" name="prompt">
          <Textarea
            v-model:value="formData.prompt"
            :rows="6"
            :maxlength="1024"
            show-count
            placeholder="描述想要的歌曲，例如：一首关于夏日海边的轻快流行歌，女声"
          />
        </FormItem>

        <!-- 自定义、续写：歌词、风格、名称 -->
        <template v-else>
          <FormItem
            v-if="!formData.makeInstrumental || extendSource"
            label="歌词"
            name="lyric"
          >
            <Textarea
              v-model:value="formData.lyric"
              :rows="8"
              :maxlength="1024"
              show-count
              :placeholder="
                extendSource
                  ? '输入续写部分的歌词，可留空'
                  : '输入歌词，或输入一个主题后点「AI 生成歌词」'
              "
            />
            <Button
              v-if="!extendSource"
              class="mt-2"
              size="small"
              :loading="lyricLoading"
              @click="handleGenerateLyric"
            >
              <template #icon>
                <IconifyIcon
                  icon="lucide:wand-sparkles"
                  class="mr-1 inline-block"
                />
              </template>
              AI 生成歌词
            </Button>
          </FormItem>
          <FormItem label="音乐风格" name="tags">
            <Input
              v-model:value="formData.tags"
              :maxlength="120"
              show-count
              placeholder="例如：pop, female vocals, summer"
            />
            <div class="mt-2 flex flex-wrap gap-1.5">
              <Tag
                v-for="tag in MusicPresetTags"
                :key="tag.value"
                class="!mr-0 cursor-pointer"
                :color="hasTag(tag.value) ? 'processing' : undefined"
                @click="handleTagClick(tag.value)"
              >
                {{ tag.label }}
              </Tag>
            </div>
          </FormItem>
          <FormItem label="歌曲名称" name="title">
            <Input
              v-model:value="formData.title"
              :maxlength="100"
              show-count
              placeholder="请输入歌曲名称"
            />
          </FormItem>
        </template>

        <Button
          type="primary"
          block
          :loading="submitting"
          @click="handleSubmit"
        >
          {{ extendSource ? '续写歌曲' : '开始创作' }}
        </Button>

        <!-- 上传音频 -->
        <template v-if="!extendSource">
          <Divider>或</Divider>
          <Upload
            :show-upload-list="false"
            accept=".mp3,.wav"
            :before-upload="beforeUpload"
            :custom-request="handleUpload"
            :disabled="uploading"
            class="block w-full [&_.ant-upload]:w-full"
          >
            <Button block :disabled="uploading">
              <template #icon>
                <IconifyIcon icon="lucide:upload" class="mr-1 inline-block" />
              </template>
              上传音乐
            </Button>
          </Upload>
          <div class="mt-1.5 text-xs leading-[18px] text-gray-500">
            支持 mp3 / wav；中转通常要求时长 6–60 秒、不含受版权保护的人声。
            上传完成后可作为续写来源。需中转支持 /suno/uploads/audio-url
            扩展路径（官方 SunoAPI 插件不支持）。
          </div>
        </template>
      </Form>
    </Spin>
  </Card>
</template>
