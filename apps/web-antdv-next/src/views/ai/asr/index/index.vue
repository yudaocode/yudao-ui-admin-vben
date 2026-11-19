<script lang="ts" setup>
import type { AiAsrApi } from '#/api/ai/asr';
import type { AiModelModelApi } from '#/api/ai/model/model';
import type { WavRecorder } from '#/views/ai/utils/asr';

import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from 'vue';

import { DocAlert, Page, useVbenDrawer } from '@vben/common-ui';
import { AiAsrStatusEnum, AiModelTypeEnum, DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart, formatDate } from '@vben/utils';

import { useClipboard } from '@vueuse/core';
import {
  Button,
  Card,
  Empty,
  message,
  Result,
  Select,
  Upload,
} from 'antdv-next';

import { recognizeAsr } from '#/api/ai/asr';
import { getModelSimpleList } from '#/api/ai/model/model';
import { useUpload } from '#/components/upload/use-upload';
import {
  convertToWav,
  getAsrMaxSeconds,
  startWavRecorder,
} from '#/views/ai/utils/asr';

import History from './modules/history-drawer.vue';

/** AI 语音识别：音频转文字工作台 */
defineOptions({ name: 'AiAsr' });

const [HistoryDrawer, historyDrawerApi] = useVbenDrawer({
  connectedComponent: History,
});

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 选择音频的最大字节数：在浏览器解码，避免过大

// ========== 识别模型 ==========

const modelLoading = ref(false);
const models = ref<AiModelModelApi.Model[]>([]); // 可用的语音识别模型
const modelId = ref<number>();
const modelOptions = computed(() =>
  models.value.map((item) => ({
    label: item.name,
    value: item.id,
    item,
  })),
);
const model = computed(() =>
  models.value.find((item) => item.id === modelId.value),
);
const maxSeconds = computed(() => getAsrMaxSeconds(model.value?.platform)); // 当前模型的最长音频时长

async function getModelList() {
  modelLoading.value = true;
  try {
    models.value = (await getModelSimpleList(AiModelTypeEnum.ASR)) || [];
    modelId.value = models.value[0]?.id;
  } finally {
    modelLoading.value = false;
  }
}

// ========== 工作台状态 ==========

const audio = ref<Blob>(); // 当前音频：选择的文件，或录音的 WAV；打开记录后为空，重新识别需要重新选择
const audioName = ref(''); // 音频名称，用于展示、下载的文件名
const objectUrl = ref<string>(); // 本地预览地址，切换音频时释放
const fileUrl = ref<string>(); // 当前音频转 WAV、上传到文件服务后的地址
const record = ref<AiAsrApi.Asr>(); // 当前识别记录
const recognizing = ref(false); // 识别中
const requestError = ref<string>(); // 请求失败（未生成识别记录）的提示

/** 试听：本地音频优先，否则使用记录的音频地址 */
const audioSrc = computed(() => objectUrl.value || record.value?.audioUrl);

/** 当前阶段 */
const phase = computed(() => {
  if (recognizing.value) {
    return 'recognizing';
  }
  if (record.value) {
    return record.value.status === AiAsrStatusEnum.SUCCESS ? 'success' : 'fail';
  }
  if (requestError.value) {
    return 'fail';
  }
  return audioSrc.value ? 'ready' : 'empty';
});

/** 识别结果：识别出的原文 */
const text = computed(() => record.value?.originalText ?? '');
/** 结果说明：识别模型、耗时 */
const resultMeta = computed(() => {
  const current = record.value;
  if (!current) {
    return '';
  }
  const duration = current.duration
    ? ` · ${(current.duration / 1000).toFixed(1)} 秒`
    : '';
  return `${current.modelName || ''}${duration}`;
});

/** 释放本地预览地址 */
function revokeObjectUrl() {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = undefined;
  }
}

/** 重置结果区 */
function resetResult() {
  recognizing.value = false;
  record.value = undefined;
  requestError.value = undefined;
}

/** 切换音频：清空上一次的识别结果 */
function setAudio(blob: Blob, name: string) {
  audioSession++;
  resetResult();
  revokeObjectUrl();
  audio.value = blob;
  audioName.value = name;
  objectUrl.value = URL.createObjectURL(blob);
  fileUrl.value = undefined;
}

/** 切换模型：各模型的时长上限不同，重新识别时重新转换、上传 */
watch(modelId, () => {
  fileUrl.value = undefined;
});

// ========== 选择音频 ==========

/** 选择音频：不自动上传，识别时才转换、上传 */
function handleSelectFile(file: File) {
  if (
    !file.type.startsWith('audio/') &&
    !/\.(?:mp3|wav|m4a|aac|ogg|opus|webm|flac)$/i.test(file.name)
  ) {
    message.warning('请选择音频文件');
    return Upload.LIST_IGNORE;
  }
  if (file.size > MAX_FILE_SIZE) {
    message.warning('音频文件不能超过 50 MB');
    return Upload.LIST_IGNORE;
  }
  cancelRecord();
  setAudio(file, file.name);
  return Upload.LIST_IGNORE; // 阻止组件自动上传，且不在隐藏列表中累积文件
}

// ========== 录音 ==========

const recording = ref(false); // 是否正在录音
const recordStarting = ref(false); // 正在开始录音（等待麦克风权限）
const recordStopping = ref(false); // 正在结束录音（转为 WAV）
const recordSeconds = ref(0); // 已录音的秒数
const audioRef = ref<HTMLAudioElement>(); // 音频预览
let recorder: undefined | WavRecorder;
let recordTimer: ReturnType<typeof setInterval> | undefined; // 计时，达到最长时长后自动停止
let audioSession = 0; // 音频会话号：开始录音、切换音频、取消录音、页面失活/销毁时自增，作废进行中的录音
let active = true; // 页面是否处于激活状态

/** 取消录音：放弃进行中的录音，释放麦克风 */
function cancelRecord() {
  audioSession++;
  clearInterval(recordTimer);
  recorder?.cancel();
  recorder = undefined;
  recording.value = false;
  recordStopping.value = false;
  recordSeconds.value = 0;
}

/** 点击录音：未录音时开始，录音中时停止 */
async function handleRecord() {
  if (recordStarting.value || recordStopping.value) {
    return;
  }
  if (recording.value) {
    await stopRecord();
    return;
  }
  const limit = maxSeconds.value;
  const session = ++audioSession;
  recordStarting.value = true;
  try {
    let current: WavRecorder;
    try {
      current = await startWavRecorder(limit);
    } catch {
      if (session === audioSession && active) {
        message.error('无法使用麦克风，请检查浏览器的麦克风权限');
      }
      return;
    }
    // 等待权限期间，已切换音频、取消录音，或页面失活、销毁：放弃这次录音
    if (session !== audioSession || !active) {
      current.cancel();
      return;
    }
    recorder = current;
    recording.value = true;
    recordSeconds.value = 0;
    recordTimer = setInterval(() => {
      recordSeconds.value++;
      if (recordSeconds.value >= limit) {
        stopRecord();
      }
    }, 1000);
  } finally {
    recordStarting.value = false;
  }
}

/** 停止录音：录音转为 WAV 后作为当前音频，不自动识别 */
async function stopRecord() {
  clearInterval(recordTimer);
  const current = recorder;
  if (!current) {
    return;
  }
  const session = audioSession;
  recorder = undefined;
  recording.value = false;
  recordStopping.value = true;
  try {
    const blob = await current.stop();
    // 转换期间，已切换音频、打开记录，或页面失活、销毁：丢弃录音结果
    if (session !== audioSession) {
      return;
    }
    recordStopping.value = false;
    setAudio(blob, `录音-${formatDate(new Date(), 'YYYYMMDDHHmmss')}.wav`);
  } catch {
    if (session === audioSession) {
      recordStopping.value = false;
      message.error('录音处理失败，请重新录音');
    }
  }
}

// ========== 识别 ==========

/** 上传音频到文件服务：与其它模块一致，复用上传组件的逻辑（支持前端直传、后端上传） */
const { httpRequest } = useUpload();
async function uploadAudio(wav: Blob, fileName: string): Promise<string> {
  const name = `${(fileName || 'asr').replace(/\.[^.]+$/, '')}.wav`;
  const file = new File([wav], name, { type: 'audio/wav' });
  const res: any = await httpRequest(file);
  return res?.url || res?.data || res;
}

async function recognize() {
  if (recording.value || recordStarting.value || recordStopping.value) {
    return;
  }
  if (!audio.value || !model.value) {
    return;
  }
  const currentAudio = audio.value;
  const currentName = audioName.value;
  const currentModel = model.value;
  resetResult();
  recognizing.value = true;
  try {
    // 1. 先转为 16k 单声道 WAV 并上传：时长超过当前模型上限时报错；同一段音频重试时，复用已上传的地址
    if (!fileUrl.value) {
      let wav: Blob;
      try {
        wav = await convertToWav(currentAudio, maxSeconds.value);
      } catch (error: any) {
        if (audio.value === currentAudio) {
          message.error(error?.message || '音频处理失败');
        }
        return;
      }
      // 转换期间切换了音频或打开了记录，不上传
      if (audio.value !== currentAudio) {
        return;
      }
      const url = await uploadAudio(wav, currentName);
      if (audio.value !== currentAudio) {
        return;
      }
      fileUrl.value = url;
    }
    // 2. 识别：成功、失败都会生成一条记录
    const data = await recognizeAsr({
      modelId: currentModel.id,
      fileUrl: fileUrl.value,
    });
    // 识别期间切换了音频或打开了记录，不覆盖当前内容
    if (audio.value !== currentAudio) {
      return;
    }
    record.value = data;
  } catch {
    if (audio.value === currentAudio) {
      requestError.value = '识别请求失败，请检查音频和识别模型后重试';
    }
  } finally {
    if (audio.value === currentAudio) {
      recognizing.value = false;
    }
  }
}

// ========== 复制、下载 ==========

const { copy } = useClipboard({ legacy: true }); // 粘贴板

/** 复制识别结果 */
async function handleCopy() {
  try {
    await copy(text.value);
    message.success('复制成功');
  } catch {
    message.error('复制失败，请手动选择文本复制');
  }
}

/** 下载识别结果为 TXT */
function handleDownload() {
  const name = (audioName.value || record.value?.fileName || 'asr').replace(
    /\.[^.]+$/,
    '',
  );
  downloadFileFromBlobPart({
    fileName: `${name}.txt`,
    source: new Blob([text.value], { type: 'text/plain;charset=utf-8' }),
  });
}

// ========== 识别记录 ==========

/** 打开识别记录 */
function openHistory() {
  historyDrawerApi.open();
}

/** 打开记录：展示识别结果；没有本地音频，重新识别需要重新上传或录音 */
function openRecord(item: AiAsrApi.Asr) {
  if (item.id === record.value?.id) {
    cancelRecord(); // 不替换当前内容，但放弃仍在进行的录音
    historyDrawerApi.close();
    return;
  }
  cancelRecord();
  resetResult();
  revokeObjectUrl();
  audio.value = undefined;
  fileUrl.value = undefined;
  audioName.value = item.fileName;
  record.value = item;
  historyDrawerApi.close();
}

/** 删除的是当前记录时，结果区回到待识别 */
function handleDeleted(id: number) {
  if (record.value?.id !== id) {
    return;
  }
  resetResult();
  if (!audio.value) {
    audioName.value = '';
  }
}

/** 初始化 */
onMounted(() => {
  getModelList();
});
/** 激活 */
onActivated(() => {
  active = true;
});
/** 失活（缓存页离开）：放弃进行中的录音，暂停试听 */
onDeactivated(() => {
  cancelRecord();
  audioRef.value?.pause();
  active = false;
});
/** 销毁：放弃进行中的录音，释放麦克风和预览地址 */
onBeforeUnmount(() => {
  cancelRecord();
  revokeObjectUrl();
  active = false;
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="AI 语音识别" url="https://doc.iocoder.cn/ai/asr/" />
    </template>
    <div class="flex h-full gap-4 overflow-hidden">
      <!-- 左：输入（识别模型、音频、开始识别） -->
      <Card
        class="h-full w-[460px] flex-shrink-0"
        :styles="{
          body: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          },
        }"
      >
        <div class="mb-4 flex items-center justify-between gap-2">
          <span class="whitespace-nowrap text-base font-bold">
            AI 语音识别
          </span>
          <Button type="link" size="small" @click="openHistory">
            <template #icon>
              <IconifyIcon icon="lucide:history" class="mr-1 inline-block" />
            </template>
            识别记录
          </Button>
        </div>

        <div class="mb-2 whitespace-nowrap text-sm">
          <span class="mr-1 text-red-500">*</span>识别模型
        </div>
        <Select
          v-model:value="modelId"
          :options="modelOptions"
          placeholder="请选择识别模型"
          class="mb-4 !w-full"
          :loading="modelLoading"
          :disabled="recording || recordStarting || recognizing"
        >
          <template #optionRender="{ option }">
            <div class="flex items-center justify-between gap-3">
              <span class="truncate">{{ option.data.label }}</span>
              <span class="flex-shrink-0 text-xs text-gray-500">
                {{
                  getDictLabel(
                    DICT_TYPE.AI_PLATFORM,
                    option.data.item.platform,
                  ) || option.data.item.platform
                }}
              </span>
            </div>
          </template>
          <template #notFoundContent>
            暂无可用的语音识别模型，请联系管理员配置
          </template>
        </Select>

        <div class="mb-2 flex items-center justify-between text-sm">
          <span><span class="mr-1 text-red-500">*</span>音频</span>
          <span class="text-xs text-gray-500">
            当前模型最长 {{ maxSeconds }} 秒
          </span>
        </div>
        <!-- 选择音频：识别时才上传 -->
        <Upload.Dragger
          accept="audio/*"
          :multiple="false"
          :show-upload-list="false"
          :disabled="recording || recordStarting || recognizing"
          :before-upload="handleSelectFile"
        >
          <p class="ant-upload-drag-icon">
            <IconifyIcon
              icon="lucide:upload"
              class="inline-block size-10 text-gray-400"
            />
          </p>
          <p class="ant-upload-text">拖拽音频到这里，或点击上传</p>
          <p class="ant-upload-hint">
            支持 mp3、wav、m4a 等常见格式，识别时在浏览器转为 16k WAV 后上传
          </p>
        </Upload.Dragger>
        <!-- 录音 -->
        <Button
          class="mt-3"
          block
          :danger="recording"
          :type="recording ? 'primary' : 'default'"
          :loading="recordStarting || recordStopping"
          :disabled="
            recognizing || !modelId || recordStarting || recordStopping
          "
          @click="handleRecord"
        >
          <template #icon>
            <IconifyIcon
              :icon="recording ? 'lucide:square' : 'lucide:mic'"
              class="mr-1 inline-block"
            />
          </template>
          {{
            recording
              ? `停止录音（${recordSeconds} / ${maxSeconds} 秒）`
              : '开始录音'
          }}
        </Button>
        <!-- 音频预览：本地音频优先，否则使用记录的音频地址 -->
        <div v-if="audioSrc" class="mt-3">
          <div class="mb-1 truncate text-xs text-gray-500">
            {{ audioName }}
          </div>
          <audio ref="audioRef" :src="audioSrc" controls class="w-full"></audio>
        </div>

        <div class="flex-1"></div>
        <Button
          type="primary"
          size="large"
          class="mt-4"
          block
          :loading="recognizing"
          :disabled="
            !audio || !modelId || recording || recordStarting || recordStopping
          "
          @click="recognize"
        >
          {{
            recognizing
              ? '识别中'
              : record || requestError
                ? '重新识别'
                : '开始识别'
          }}
        </Button>
      </Card>

      <!-- 右：识别结果 -->
      <Card
        class="h-full min-w-0 flex-1"
        :styles="{
          body: { height: '100%', display: 'flex', flexDirection: 'column' },
        }"
      >
        <!-- 标题、识别模型与耗时；识别成功时右侧为复制、下载 -->
        <div class="mb-3 flex min-w-0 items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2">
            <span class="whitespace-nowrap text-base font-bold">识别结果</span>
            <span
              v-if="phase === 'success'"
              class="truncate text-xs text-gray-500"
            >
              {{ resultMeta }}
            </span>
          </div>
          <div
            v-if="phase === 'success'"
            class="flex flex-wrap items-center gap-2"
          >
            <Button size="small" @click="handleCopy">
              <template #icon>
                <IconifyIcon icon="lucide:copy" class="mr-1 inline-block" />
              </template>
              复制
            </Button>
            <Button size="small" @click="handleDownload">
              <template #icon>
                <IconifyIcon icon="lucide:download" class="mr-1 inline-block" />
              </template>
              下载 TXT
            </Button>
          </div>
        </div>

        <div class="flex min-h-0 flex-1 flex-col">
          <!-- 空状态 -->
          <Empty
            v-if="phase === 'empty'"
            class="flex h-full flex-col items-center justify-center"
            description="在左侧选择识别模型，上传音频或录音后，点击「开始识别」"
          />
          <!-- 待识别：识别按钮统一在左侧底部 -->
          <Empty
            v-else-if="phase === 'ready'"
            class="flex h-full flex-col items-center justify-center"
            :description="
              audio
                ? '音频已就绪，点击左侧「开始识别」'
                : '请在左侧重新上传音频或录音后再识别'
            "
          />
          <!-- 识别中 -->
          <div
            v-else-if="phase === 'recognizing'"
            class="flex h-full flex-col items-center justify-center gap-3 text-gray-500"
          >
            <IconifyIcon
              icon="lucide:loader-circle"
              class="size-8 animate-spin text-primary"
            />
            <span>正在识别，请稍候…</span>
          </div>
          <!-- 识别失败：失败原因按纯文本展示 -->
          <Result
            v-else-if="phase === 'fail'"
            status="error"
            title="识别失败"
            class="h-full"
          >
            <template #subTitle>
              <div
                class="mx-auto max-w-[480px] whitespace-pre-wrap break-all text-[13px]"
              >
                {{ record?.errorMessage || requestError }}
              </div>
            </template>
            <template #extra>
              <Button
                v-if="audio"
                type="primary"
                :disabled="
                  !modelId || recording || recordStarting || recordStopping
                "
                @click="recognize"
              >
                重试
              </Button>
              <span v-else class="text-[13px] text-gray-500">
                请在左侧重新上传音频或录音
              </span>
            </template>
          </Result>
          <!-- 识别成功：只展示识别出的原文 -->
          <template v-else>
            <div
              class="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-all rounded-md border border-solid border-border p-3 text-sm leading-[1.7]"
            >
              <template v-if="text">{{ text }}</template>
              <span v-else class="text-gray-400">音频中没有识别到文字</span>
            </div>
            <div class="mt-2 flex justify-between text-xs text-gray-500">
              <span>共 {{ text.length }} 字</span>
              <span>重新识别会新增一条记录</span>
            </div>
          </template>
        </div>
      </Card>
    </div>

    <!-- 识别记录 -->
    <HistoryDrawer
      :current-id="record?.id"
      @open="openRecord"
      @deleted="handleDeleted"
    />
  </Page>
</template>
