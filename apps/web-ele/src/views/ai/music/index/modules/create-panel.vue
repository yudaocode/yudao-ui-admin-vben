<script lang="ts" setup>
import type {
  FormInstance,
  FormRules,
  UploadRawFile,
  UploadRequestOptions,
} from 'element-plus';

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
  ElAvatar,
  ElButton,
  ElDivider,
  ElForm,
  ElFormItem,
  ElImage,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
  ElTag,
  ElUpload,
} from 'element-plus';

import { getModelSimpleList } from '#/api/ai/model/model';
import {
  extendMusic,
  generateLyric,
  generateMusic,
  uploadMusic,
} from '#/api/ai/music';
import { formatMusicDuration, getMusicTitle } from '#/views/ai/utils/format';

/** AI 音乐：创作面板（灵感、自定义、续写、上传） */
defineOptions({ name: 'AiMusicCreatePanel' });

const emit = defineEmits<{
  submitted: []; // 提交成功，用于刷新作品列表
}>();

const formRef = ref<FormInstance>(); // 表单 Ref
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

// ========== 模型 ==========

const modelList = ref<AiModelModelApi.Model[]>([]); // 音乐模型列表
const selectedModel = computed(() =>
  modelList.value.find((item) => item.id === formData.modelId),
);

/** 加载音乐模型：只取 Suno 平台，默认选中第一个 */
async function loadModelList() {
  modelList.value = await getModelSimpleList(
    AiModelTypeEnum.MUSIC,
    AiPlatformEnum.SUNO,
  );
  if (!formData.modelId && modelList.value.length > 0) {
    formData.modelId = modelList.value[0]!.id;
  }
}

// ========== 表单校验 ==========

/** 续写起点：不能超过原曲时长。只在字段下提示，不弹全局消息 */
function validateExtendSeconds(
  _rule: any,
  value: number | undefined,
  callback: (error?: Error) => void,
) {
  if (value === undefined || value === null) {
    callback(new Error('请输入续写起点'));
    return;
  }
  const duration = extendSource.value?.duration;
  if (duration !== undefined && duration !== null && value > duration) {
    callback(new Error('续写起点不能超过原曲时长'));
    return;
  }
  callback();
}

const formRules = computed<FormRules>(() => {
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

// ========== 音乐风格 ==========

/** 音乐风格：点选预置标签追加或移除 */
function splitTags() {
  return formData.tags
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function hasTag(value: string) {
  return splitTags().includes(value);
}

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
    ElMessage.warning('音乐风格不能超过 120 个字符');
    return;
  }
  formData.tags = joined;
}

// ========== 歌词 ==========

/** AI 生成歌词：歌词框内容作为主题，返回的第一行作为名称 */
const lyricLoading = ref(false);
async function handleGenerateLyric() {
  const prompt = formData.lyric.trim();
  if (!prompt) {
    ElMessage.warning('请先在歌词框输入歌词主题');
    return;
  }
  lyricLoading.value = true;
  try {
    const data = await generateLyric(prompt);
    formData.lyric = (data.lyric || '').slice(0, 1024);
    if (data.title) {
      formData.title = data.title.slice(0, 100);
    }
    ElMessage.success('歌词生成成功');
  } finally {
    lyricLoading.value = false;
  }
}

// ========== 提交 ==========

/** 提交创作或续写 */
const submitting = ref(false);
async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch (error: any) {
    // 普通创作补一条全局提示；续写只在字段下提示
    if (!extendSource.value) {
      const first = Object.values(error || {})[0] as any[] | undefined;
      if (first?.[0]?.message) {
        ElMessage.error(first[0].message);
      }
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
      ElMessage.success('续写任务已提交');
      cancelExtend();
    } else if (isInspiration.value) {
      await generateMusic({
        generateMode: AiMusicGenerateModeEnum.INSPIRATION,
        modelId: formData.modelId!,
        prompt: formData.prompt,
        makeInstrumental: formData.makeInstrumental,
      });
      ElMessage.success('创作任务已提交');
    } else {
      await generateMusic({
        generateMode: AiMusicGenerateModeEnum.CUSTOM,
        modelId: formData.modelId!,
        lyric: formData.makeInstrumental ? undefined : formData.lyric,
        tags: formData.tags || undefined,
        title: formData.title,
        makeInstrumental: formData.makeInstrumental,
      });
      ElMessage.success('创作任务已提交');
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

/** 上传音频：由后端存到文件服务，再提交上传任务 */
const uploading = ref(false);
const MAX_UPLOAD_MB = 50;

function beforeUpload(file: UploadRawFile) {
  if (!formData.modelId) {
    ElMessage.warning('请先选择模型');
    return false;
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'mp3' && ext !== 'wav') {
    ElMessage.error('只支持 mp3、wav 格式的音频');
    return false;
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    ElMessage.error(`音频大小不能超过 ${MAX_UPLOAD_MB}MB`);
    return false;
  }
  uploading.value = true;
  return true;
}

function httpRequest(options: UploadRequestOptions) {
  const name = options.file.name.replace(/\.[^.]+$/, '');
  return uploadMusic({
    modelId: formData.modelId!,
    file: options.file,
    title: name ? name.slice(0, 100) : undefined,
  });
}

function handleUploadSuccess() {
  uploading.value = false;
  ElMessage.success('歌曲上传成功，正在处理');
  emit('submitted');
}

function handleUploadError() {
  // 失败原因已由请求拦截器提示
  uploading.value = false;
}

onMounted(loadModelList);
</script>

<template>
  <div class="size-full overflow-y-auto rounded-lg bg-card p-4">
    <ElForm
      ref="formRef"
      v-loading="uploading"
      :model="formData"
      :rules="formRules"
      label-position="top"
      element-loading-text="音频上传中..."
    >
      <!-- 续写来源 -->
      <template v-if="extendSource">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-base font-bold">续写歌曲</span>
          <ElButton link type="primary" @click="cancelExtend">
            <IconifyIcon icon="ep:close" class="mr-1" /> 取消续写
          </ElButton>
        </div>
        <div
          class="mb-4 flex items-center gap-2.5 rounded-md bg-[var(--el-fill-color-light)] p-2.5"
        >
          <ElImage
            :src="extendSource.coverUrl"
            fit="cover"
            class="size-12 flex-shrink-0 rounded"
          >
            <template #error>
              <div class="flex size-full items-center justify-center">
                <IconifyIcon icon="ep:headset" />
              </div>
            </template>
          </ElImage>
          <div class="min-w-0 flex-1">
            <div class="truncate font-bold">
              {{ getMusicTitle(extendSource.title) }}
            </div>
            <div class="text-xs text-[var(--el-text-color-secondary)]">
              {{ extendSource.model }} · 时长
              {{ formatMusicDuration(extendSource.duration) }}
            </div>
          </div>
        </div>
        <ElFormItem label="续写起点（秒）" prop="extendSeconds">
          <ElInputNumber
            v-model="formData.extendSeconds"
            :min="0"
            :precision="0"
            controls-position="right"
            class="!w-full"
          />
          <div class="text-xs text-[var(--el-text-color-secondary)]">
            从原曲该时间点开始续写，默认原曲结尾；模型与渠道沿用原曲
          </div>
        </ElFormItem>
      </template>

      <!-- 创作模式、模型 -->
      <template v-else>
        <ElFormItem label="创作模式" prop="generateMode">
          <ElRadioGroup v-model="formData.generateMode">
            <ElRadioButton :value="AiMusicGenerateModeEnum.INSPIRATION">
              灵感模式
            </ElRadioButton>
            <ElRadioButton :value="AiMusicGenerateModeEnum.CUSTOM">
              自定义模式
            </ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="模型" prop="modelId">
          <ElSelect
            v-model="formData.modelId"
            placeholder="请选择音乐模型"
            filterable
            class="!w-full"
          >
            <template v-if="selectedModel" #prefix>
              <ElAvatar
                :size="18"
                shape="square"
                :src="selectedModel.iconUrl || undefined"
              >
                <IconifyIcon icon="ep:cpu" class="size-3" />
              </ElAvatar>
            </template>
            <!-- 带简介的选项为两行，放开默认的单行高度 -->
            <ElOption
              v-for="item in modelList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
              class="!h-auto !min-h-[34px] !py-1"
            >
              <div class="flex items-center gap-2 overflow-hidden">
                <ElAvatar
                  :size="24"
                  shape="square"
                  :src="item.iconUrl || undefined"
                  class="flex-shrink-0"
                >
                  <IconifyIcon icon="ep:cpu" class="size-3.5" />
                </ElAvatar>
                <div class="min-w-0 flex-1 overflow-hidden">
                  <div class="truncate leading-[18px]">{{ item.name }}</div>
                  <div
                    v-if="item.description"
                    class="truncate text-xs leading-4 text-[var(--el-text-color-secondary)]"
                    :title="item.description"
                  >
                    {{ item.description }}
                  </div>
                </div>
              </div>
            </ElOption>
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="纯音乐" prop="makeInstrumental">
          <ElSwitch v-model="formData.makeInstrumental" />
          <span class="ml-2 text-xs text-[var(--el-text-color-secondary)]">
            开启后生成不带人声的音乐
          </span>
        </ElFormItem>
      </template>

      <!-- 灵感模式：歌曲描述 -->
      <ElFormItem v-if="isInspiration" label="歌曲描述" prop="prompt">
        <ElInput
          v-model="formData.prompt"
          type="textarea"
          :rows="6"
          :maxlength="1024"
          show-word-limit
          placeholder="描述想要的歌曲，例如：一首关于夏日海边的轻快流行歌，女声"
        />
      </ElFormItem>

      <!-- 自定义、续写：歌词、风格、名称 -->
      <template v-else>
        <ElFormItem
          v-if="!formData.makeInstrumental || extendSource"
          label="歌词"
          prop="lyric"
        >
          <ElInput
            v-model="formData.lyric"
            type="textarea"
            :rows="8"
            :maxlength="1024"
            show-word-limit
            :placeholder="
              extendSource
                ? '输入续写部分的歌词，可留空'
                : '输入歌词，或输入一个主题后点「AI 生成歌词」'
            "
          />
          <ElButton
            v-if="!extendSource"
            class="mt-2"
            size="small"
            :loading="lyricLoading"
            @click="handleGenerateLyric"
          >
            <IconifyIcon icon="ep:magic-stick" class="mr-1" /> AI 生成歌词
          </ElButton>
        </ElFormItem>
        <ElFormItem label="音乐风格" prop="tags">
          <ElInput
            v-model="formData.tags"
            :maxlength="120"
            show-word-limit
            placeholder="例如：pop, female vocals, summer"
          />
          <div class="mt-2 flex flex-wrap gap-1.5">
            <ElTag
              v-for="tag in MusicPresetTags"
              :key="tag.value"
              class="cursor-pointer"
              :effect="hasTag(tag.value) ? 'dark' : 'plain'"
              @click="handleTagClick(tag.value)"
            >
              {{ tag.label }}
            </ElTag>
          </div>
        </ElFormItem>
        <ElFormItem label="歌曲名称" prop="title">
          <ElInput
            v-model="formData.title"
            :maxlength="100"
            show-word-limit
            placeholder="请输入歌曲名称"
          />
        </ElFormItem>
      </template>

      <ElButton
        type="primary"
        class="!w-full"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ extendSource ? '续写歌曲' : '开始创作' }}
      </ElButton>

      <!-- 上传音频 -->
      <template v-if="!extendSource">
        <ElDivider>或</ElDivider>
        <ElUpload
          :show-file-list="false"
          accept=".mp3,.wav"
          :http-request="httpRequest"
          :before-upload="beforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :disabled="uploading"
          class="w-full [&_.el-upload]:w-full"
        >
          <ElButton class="!w-full" :disabled="uploading">
            <IconifyIcon icon="ep:upload" class="mr-1" /> 上传音乐
          </ElButton>
        </ElUpload>
        <div
          class="mt-1.5 text-xs leading-[18px] text-[var(--el-text-color-secondary)]"
        >
          支持 mp3 / wav；中转通常要求时长 6–60 秒、不含受版权保护的人声。
          上传完成后可作为续写来源。需中转支持 /suno/uploads/audio-url
          扩展路径（官方 SunoAPI 插件不支持）。
        </div>
      </template>
    </ElForm>
  </div>
</template>
