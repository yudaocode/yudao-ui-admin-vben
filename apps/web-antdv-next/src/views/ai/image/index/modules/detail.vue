<script lang="ts" setup>
import type { AiImageApi } from '#/api/ai/image';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { AiImageModeEnum, AiImageStatusEnum, DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import {
  Alert,
  Button,
  Descriptions,
  DescriptionsItem,
  Image,
  ImagePreviewGroup,
  Spin,
  Tag,
} from 'antdv-next';

import { getImage, getImageMy, getImagePublic } from '#/api/ai/image';
import { DictTag } from '#/components/dict-tag';
import {
  AiImageInputRoleLabels,
  AiImagePlatformEnum,
} from '#/views/ai/image/constants';

/** AI 绘图：作品详情（我的作品：主人视角；公开画廊：公开视角；作品管理：管理员视角） */
defineOptions({ name: 'AiImageDetail' });

const loading = ref(false); // 弹窗的加载中
const scope = ref('mine'); // 详情的来源：mine - 我的作品；public - 公开画廊；admin - 作品管理
const detail = ref<AiImageApi.Image>(); // 详情
let requestId = 0; // 请求序号：只采用最后一次打开的结果

const getTitle = computed(() =>
  scope.value === 'public' ? '作品详情' : `作品详情 #${detail.value?.id ?? ''}`,
);

const inputImages = computed(() => detail.value?.inputImages || []);

/** 尺寸：MJ 记录的宽高为比例；宽高为 0 表示未知 */
const sizeText = computed(() => {
  const image = detail.value;
  if (!image) {
    return '-';
  }
  if (image.mode !== AiImageModeEnum.DRAW) {
    return (
      image.midjourneyOptions?.aspectRatio ||
      (image.width && image.height ? `${image.width}:${image.height}` : '-')
    );
  }
  if (image.seedreamOptions) {
    return (
      image.seedreamOptions.resultSize || image.seedreamOptions.size || '-'
    );
  }
  return image.width && image.height ? `${image.width}x${image.height}` : '-';
});

/** 参数：三类 Options 中有值的字段 */
const PARAM_LABELS: Record<string, string> = {
  // 通用模型
  quality: '画质',
  aspectRatio: '比例',
  seed: '随机种子',
  steps: '推理步数',
  cfgScale: '引导系数',
  sampler: '采样方法',
  stylePreset: '风格预设',
  clipGuidancePreset: 'CLIP 引导',
  style: '风格',
  // Midjourney
  version: '版本',
  stylize: '风格化 --s',
  chaos: '创意度 --c',
  tile: '平铺 --tile',
  raw: 'RAW --raw',
  hd: 'HD --hd',
  imageWeight: '图片权重 --iw',
  characterWeight: '角色权重 --cw',
  styleWeight: '风格权重 --sw',
  styleVersion: '风格版本 --sv',
  dimensions: '融图尺寸',
  actionLabel: '按钮动作',
  providerStatus: '中转状态',
  modalProtocol: '局部重绘协议',
  // Seedream
  size: '尺寸档位',
  optimizePromptMode: '提示词优化',
  watermark: '水印',
  resultSize: '结果尺寸',
  errorCode: '错误码',
};
const HIDDEN_PARAMS = new Set([
  'buttons',
  'customId',
  'extra',
  'finalPrompt',
  'legacy',
  'usage',
]);
const params = computed(() => {
  const image = detail.value;
  if (!image) {
    return [];
  }
  const result: { label: string; value: string }[] = [];
  const append = (options?: Record<string, any>) => {
    Object.entries(options || {}).forEach(([key, value]) => {
      if (
        value === null ||
        value === undefined ||
        value === '' ||
        HIDDEN_PARAMS.has(key)
      ) {
        return;
      }
      if (
        scope.value === 'public' &&
        (key === 'providerStatus' || key === 'errorCode')
      ) {
        return;
      }
      result.push({
        label: PARAM_LABELS[key] || key,
        value:
          typeof value === 'object' ? JSON.stringify(value) : String(value),
      });
    });
  };
  append(image.options);
  append(image.midjourneyOptions);
  append(image.seedreamOptions);
  return result;
});

/** 加载详情：按来源调用对应的接口 */
async function loadDetail(id?: number) {
  if (!id) {
    return;
  }
  const currentRequestId = ++requestId;
  detail.value = undefined;
  loading.value = true;
  try {
    let result: AiImageApi.Image;
    if (scope.value === 'public') {
      result = await getImagePublic(id);
    } else if (scope.value === 'admin') {
      result = await getImage(id);
    } else {
      result = await getImageMy(id);
    }
    if (currentRequestId === requestId) {
      detail.value = result;
    }
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false;
    }
  }
}

const [Modal, modalApi] = useVbenModal({
  footer: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      detail.value = undefined;
      return;
    }
    const data = modalApi.getData() as { id: number; scope?: string };
    if (!data?.id) {
      return;
    }
    scope.value = data.scope || 'mine';
    await loadDetail(data.id);
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[960px]">
    <Spin :spinning="loading">
      <div class="flex min-h-[320px] gap-5">
        <!-- 左：图片 -->
        <div class="w-[360px] flex-shrink-0">
          <div
            class="flex h-[360px] items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
          >
            <Image
              v-if="
                detail?.picUrl && detail.status === AiImageStatusEnum.SUCCESS
              "
              :src="detail.picUrl"
              width="100%"
              height="100%"
              class="object-contain"
            />
            <span v-else class="text-xs text-gray-500">
              {{
                detail?.status === AiImageStatusEnum.IN_PROGRESS
                  ? '生成中'
                  : '暂无图片'
              }}
            </span>
          </div>
          <!-- 输入图片：按角色 -->
          <div v-if="inputImages.length > 0" class="mt-3">
            <div class="mb-1.5 text-[13px] font-bold">输入图片</div>
            <ImagePreviewGroup>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(item, index) in inputImages"
                  :key="index"
                  class="w-20 text-center"
                >
                  <Image
                    :src="item.url"
                    :width="80"
                    :height="80"
                    class="rounded-md object-cover"
                  />
                  <div class="text-xs text-gray-500">
                    {{ AiImageInputRoleLabels[item.role] || item.role }}
                  </div>
                </div>
              </div>
            </ImagePreviewGroup>
          </div>
        </div>

        <!-- 右：信息 -->
        <div v-if="detail" class="min-w-0 flex-1">
          <Descriptions :column="2" size="small" bordered>
            <DescriptionsItem label="类型">
              <Tag
                v-if="detail.platform === AiImagePlatformEnum.DOU_BAO"
                color="blue"
              >
                Seedream
              </Tag>
              <DictTag
                v-else
                :type="DICT_TYPE.AI_IMAGE_MODE"
                :value="detail.mode"
              />
            </DescriptionsItem>
            <DescriptionsItem label="状态">
              <DictTag
                :type="DICT_TYPE.AI_IMAGE_STATUS"
                :value="detail.status"
              />
              <span v-if="detail.status === AiImageStatusEnum.IN_PROGRESS">
                {{ detail.progress || 0 }}%
              </span>
            </DescriptionsItem>
            <DescriptionsItem label="平台">
              <DictTag :type="DICT_TYPE.AI_PLATFORM" :value="detail.platform" />
            </DescriptionsItem>
            <DescriptionsItem label="模型">{{ detail.model }}</DescriptionsItem>
            <DescriptionsItem label="尺寸">{{ sizeText }}</DescriptionsItem>
            <DescriptionsItem label="公开">
              {{ detail.publicStatus ? '已公开' : '未公开' }}
            </DescriptionsItem>
            <DescriptionsItem label="提交时间">
              {{ formatDateTime(detail.createTime) }}
            </DescriptionsItem>
            <DescriptionsItem label="完成时间">
              {{ detail.finishTime ? formatDateTime(detail.finishTime) : '-' }}
            </DescriptionsItem>
            <template v-if="scope === 'admin'">
              <DescriptionsItem label="用户编号">
                {{ detail.userId }}
              </DescriptionsItem>
              <DescriptionsItem label="密钥编号">
                {{ detail.apiKeyId ?? '-' }}
              </DescriptionsItem>
            </template>
            <DescriptionsItem
              v-if="scope !== 'public'"
              label="上游任务号"
              :span="2"
            >
              <span class="break-all">{{ detail.taskId || '-' }}</span>
            </DescriptionsItem>
          </Descriptions>

          <!-- 提示词：三段 -->
          <div class="mt-4 text-[13px] font-bold">提示词</div>
          <Descriptions :column="1" size="small" bordered class="mt-1.5">
            <DescriptionsItem label="画面描述">
              <div class="whitespace-pre-wrap break-all">
                {{ detail.prompt || '-' }}
              </div>
            </DescriptionsItem>
            <DescriptionsItem v-if="detail.negativePrompt" label="不希望出现">
              <div class="whitespace-pre-wrap break-all">
                {{ detail.negativePrompt }}
              </div>
            </DescriptionsItem>
            <DescriptionsItem
              v-if="detail.midjourneyOptions?.finalPrompt"
              label="最终提示词"
            >
              <div class="whitespace-pre-wrap break-all">
                {{ detail.midjourneyOptions.finalPrompt }}
              </div>
            </DescriptionsItem>
          </Descriptions>

          <!-- 参数 -->
          <template v-if="params.length > 0">
            <div class="mt-4 text-[13px] font-bold">参数</div>
            <Descriptions :column="2" size="small" bordered class="mt-1.5">
              <DescriptionsItem
                v-for="item in params"
                :key="item.label"
                :label="item.label"
              >
                <span class="break-all">{{ item.value }}</span>
              </DescriptionsItem>
            </Descriptions>
          </template>

          <!-- 失败原因：公开视角不展示 -->
          <Alert
            v-if="scope !== 'public' && detail.errorMessage"
            :title="detail.errorMessage"
            type="error"
            class="mt-4"
          />

          <!-- 来源、派生 -->
          <template
            v-if="
              scope !== 'public' && (detail.parentId || detail.children?.length)
            "
          >
            <div class="mt-4 text-[13px] font-bold">来源与派生</div>
            <div class="mt-1.5 flex flex-col gap-1.5 text-[13px]">
              <div v-if="detail.parentId">
                来源作品：
                <Button
                  type="link"
                  size="small"
                  class="!px-0"
                  @click="loadDetail(detail.parentId)"
                >
                  #{{ detail.parentId }}
                </Button>
              </div>
              <div
                v-for="child in detail.children"
                :key="child.id"
                class="flex items-center gap-2"
              >
                <span>派生作品：</span>
                <Button
                  type="link"
                  size="small"
                  class="!px-0"
                  @click="loadDetail(child.id)"
                >
                  #{{ child.id }}
                </Button>
                <DictTag :type="DICT_TYPE.AI_IMAGE_MODE" :value="child.mode" />
                <span class="text-gray-500">
                  {{ child.midjourneyOptions?.actionLabel }}
                </span>
                <DictTag
                  :type="DICT_TYPE.AI_IMAGE_STATUS"
                  :value="child.status"
                />
              </div>
            </div>
          </template>
        </div>
      </div>
    </Spin>
  </Modal>
</template>
