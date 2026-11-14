<script lang="ts" setup>
import type { AiOcrApi } from '#/api/ai/ocr';

import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
} from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { AiOcrStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { useClipboard, useEventListener } from '@vueuse/core';
import { Button, Card, Empty, message, Result, Select } from 'antdv-next';

import { getOcrModelList, recognizeOcr } from '#/api/ai/ocr';
import { useUpload } from '#/components/upload/use-upload';

import History from './modules/history-drawer.vue';
import ImagePane from './modules/image-pane.vue';

/** AI 文字识别：图片转文字工作台 */
defineOptions({ name: 'AiOcr' });

const [HistoryDrawer, historyDrawerApi] = useVbenDrawer({
  connectedComponent: History,
});

const imagePaneRef = ref<InstanceType<typeof ImagePane>>();

// ========== 识别服务 ==========

const modelLoading = ref(false);
const models = ref<AiOcrApi.OcrModel[]>([]); // 可用的识别服务：后端已按启用、密钥、平台过滤并排序
const modelId = ref<number>();
const modelOptions = computed(() =>
  models.value.map((item) => ({
    label: item.name,
    value: item.id,
    item,
  })),
);

async function getModelList() {
  modelLoading.value = true;
  try {
    models.value = await getOcrModelList();
    if (!models.value.some((model) => model.id === modelId.value)) {
      modelId.value = models.value[0]?.id;
    }
  } finally {
    modelLoading.value = false;
  }
}

// ========== 工作台状态 ==========

const file = ref<File>(); // 当前图片文件：只有本次上传的图片可以直接重试；切换图片、打开记录后，旧的识别结果不再覆盖
const fileUrl = ref<string>(); // 当前图片上传到文件服务后的地址
const objectUrl = ref<string>(); // 本地预览地址，切换图片时释放
const fileName = ref<string>(); // 文件名
const record = ref<AiOcrApi.Ocr>(); // 当前识别记录
const recognizing = ref(false); // 识别中
const requestError = ref<string>(); // 请求失败（未生成识别记录）的提示

/** 预览图：本地文件优先，否则使用记录的图片地址 */
const imageSrc = computed(() => objectUrl.value || record.value?.imageUrl);

/** 当前阶段 */
const phase = computed(() => {
  if (recognizing.value) {
    return 'recognizing';
  }
  if (record.value) {
    return record.value.status === AiOcrStatusEnum.SUCCESS ? 'success' : 'fail';
  }
  if (requestError.value) {
    return 'fail';
  }
  return imageSrc.value ? 'ready' : 'empty';
});

/** 识别结果：只展示识别出的原文 */
const text = computed(() => record.value?.originalText ?? '');
/** 结果说明：识别服务、耗时 */
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

// ========== 选择图片 ==========

function selectFile(newFile: File) {
  if (!newFile.type.startsWith('image/')) {
    message.warning('请选择图片文件');
    return;
  }
  resetResult();
  revokeObjectUrl();
  file.value = newFile;
  fileUrl.value = undefined;
  fileName.value = newFile.name;
  objectUrl.value = URL.createObjectURL(newFile);
}

/** 粘贴截图：只在页面激活、且焦点不在输入框时接管，不影响普通的文本粘贴 */
const active = ref(true);
onActivated(() => (active.value = true));
onDeactivated(() => (active.value = false));
useEventListener(document, 'paste', (event: ClipboardEvent) => {
  if (!active.value) {
    return;
  }
  const target = event.target as HTMLElement | null;
  if (
    target?.closest?.(
      'input, textarea, [contenteditable=""], [contenteditable="true"]',
    )
  ) {
    return;
  }
  const image = [...(event.clipboardData?.files || [])].find((item) =>
    item.type.startsWith('image/'),
  );
  if (!image) {
    return;
  }
  event.preventDefault();
  selectFile(image);
});

// ========== 识别 ==========

/** 上传图片到文件服务：与其它模块一致，复用上传组件的逻辑（支持前端直传、后端上传） */
const { httpRequest } = useUpload();
async function uploadImage(image: File): Promise<string> {
  const res: any = await httpRequest(image);
  return res?.url || res?.data || res;
}

async function recognize() {
  if (!file.value || !modelId.value) {
    return;
  }
  const currentFile = file.value;
  record.value = undefined;
  requestError.value = undefined;
  recognizing.value = true;
  try {
    // 先上传：同一张图片重试时，复用已上传的地址
    if (!fileUrl.value) {
      const url = await uploadImage(currentFile);
      if (file.value !== currentFile) {
        return;
      }
      fileUrl.value = url;
    }
    const data = await recognizeOcr({
      modelId: modelId.value,
      fileUrl: fileUrl.value,
    });
    // 识别期间切换了图片或打开了记录，不覆盖当前内容
    if (file.value !== currentFile) {
      return;
    }
    record.value = data;
  } catch {
    if (file.value === currentFile) {
      requestError.value = '识别请求失败，请检查图片和识别服务后重试';
    }
  } finally {
    if (file.value === currentFile) {
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
  const name = (fileName.value || record.value?.fileName || 'ocr').replace(
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

/** 打开记录：没有本地文件，重新识别需要重新上传 */
function openRecord(item: AiOcrApi.Ocr) {
  if (item.id === record.value?.id) {
    historyDrawerApi.close();
    return;
  }
  resetResult();
  revokeObjectUrl();
  file.value = undefined;
  fileUrl.value = undefined;
  fileName.value = item.fileName;
  record.value = item;
  historyDrawerApi.close();
}

/** 删除的是当前记录时，结果区回到待识别 */
function handleDeleted(id: number) {
  if (record.value?.id !== id) {
    return;
  }
  resetResult();
  if (!file.value) {
    fileName.value = undefined;
  }
}

/** 初始化 */
onMounted(() => {
  getModelList();
});
onBeforeUnmount(() => {
  revokeObjectUrl();
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-4 overflow-hidden">
      <!-- 顶部：标题、识别服务、操作 -->
      <Card class="flex-shrink-0" :styles="{ body: { padding: '14px 20px' } }">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-base font-bold">OCR 文字识别</div>
            <div class="mt-1 text-xs text-gray-500">
              图片转文字：上传图片，识别后可复制、下载
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-sm">识别服务</span>
            <Select
              v-model:value="modelId"
              :options="modelOptions"
              placeholder="请选择识别服务"
              class="!w-60"
              :loading="modelLoading"
              :disabled="recognizing"
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
                暂无可用的识别服务，请联系管理员配置
              </template>
            </Select>
            <Button
              type="primary"
              :loading="recognizing"
              :disabled="!file || !modelId"
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
            <Button @click="openHistory">
              <template #icon>
                <IconifyIcon icon="lucide:history" class="mr-1 inline-block" />
              </template>
              识别记录
            </Button>
          </div>
        </div>
      </Card>

      <div class="flex min-h-0 flex-1 gap-4">
        <!-- 左：原图 -->
        <div class="h-full min-w-0 flex-1">
          <ImagePane
            ref="imagePaneRef"
            :src="imageSrc"
            :file-name="fileName"
            :disabled="recognizing"
            @select="selectFile"
          />
        </div>

        <!-- 右：识别结果 -->
        <Card
          class="h-full min-w-0 flex-1"
          :styles="{
            body: {
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            },
          }"
        >
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="text-base font-bold">识别结果</span>
              <template v-if="record && phase === 'success'">
                <span class="text-xs text-gray-500">{{ resultMeta }}</span>
              </template>
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
                  <IconifyIcon
                    icon="lucide:download"
                    class="mr-1 inline-block"
                  />
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
              description="上传图片后，选择识别服务开始识别"
            />
            <!-- 待识别 -->
            <Empty
              v-else-if="phase === 'ready'"
              class="flex h-full flex-col items-center justify-center"
              description="图片已就绪"
            >
              <Button
                type="primary"
                :disabled="!file || !modelId"
                @click="recognize"
              >
                开始识别
              </Button>
              <div v-if="!file" class="mt-2 text-xs text-gray-500">
                请重新上传图片后再识别
              </div>
            </Empty>
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
                  v-if="file"
                  type="primary"
                  :disabled="!modelId"
                  @click="recognize"
                >
                  重试
                </Button>
                <Button
                  v-else
                  type="primary"
                  @click="imagePaneRef?.chooseFile()"
                >
                  重新上传图片
                </Button>
              </template>
            </Result>
            <!-- 识别成功：只展示识别出的原文 -->
            <template v-else>
              <div
                v-if="text"
                class="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-all rounded-md border border-solid border-border p-3 text-sm leading-[1.7]"
              >
                {{ text }}
              </div>
              <Empty
                v-else
                class="flex min-h-0 flex-1 flex-col items-center justify-center"
                description="图片中没有识别到文字"
              />
              <div class="mt-2 flex justify-between text-xs text-gray-500">
                <span>共 {{ text.length }} 字</span>
                <span>重新识别会新增一条记录</span>
              </div>
            </template>
          </div>
        </Card>
      </div>
    </div>

    <!-- 识别记录 -->
    <HistoryDrawer
      :current-id="record?.id"
      @open="openRecord"
      @deleted="handleDeleted"
    />
  </Page>
</template>
