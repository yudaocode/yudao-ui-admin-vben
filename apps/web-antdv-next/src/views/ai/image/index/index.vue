<script lang="ts" setup>
import type { AiImageApi } from '#/api/ai/image';
import type { AiModelModelApi } from '#/api/ai/model/model';

import { computed, nextTick, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { AiModelTypeEnum } from '@vben/constants';

import { Button, Card, Form, FormItem, message, Select, Tag } from 'antdv-next';

import { getModelSimpleList } from '#/api/ai/model/model';
import {
  AiImagePlatformEnum,
  DOU_BAO_UNREGISTERED,
  getImageModelCapability,
  IMAGE_MODEL_CAPABILITIES,
  isImagePlatform,
} from '#/views/ai/image/constants';

import DrawForm from './modules/draw-form.vue';
import MidjourneyForm from './modules/midjourney-form.vue';
import Works from './modules/works.vue';

/** AI 绘图：统一创作工作台 */
defineOptions({ name: 'AiImage' });

interface ModelItem {
  model: AiModelModelApi.Model;
  disabledReason?: string; // 不可选的原因
  legacy?: boolean;
  unregistered?: boolean; // 未登记：按平台保守能力
  tags: string[]; // 能力标签
}

const models = ref<ModelItem[]>([]); // 绘图模型列表
const modelsLoaded = ref(false);
const modelsError = ref(false); // 模型列表加载失败：提示重试
const modelId = ref<number>(); // 选中的模型编号
const selectedModel = computed(
  () => models.value.find((item) => item.model.id === modelId.value)?.model,
);
const isMidjourney = computed(
  () => selectedModel.value?.platform === AiImagePlatformEnum.MIDJOURNEY,
);
const selectedCapability = computed(() =>
  selectedModel.value
    ? getImageModelCapability(
        selectedModel.value.platform,
        selectedModel.value.model,
      )
    : null,
);

/** 模型下拉：按 通用模型 / Seedream / Midjourney 分组 */
const modelGroups = computed(() => {
  const groups = [
    {
      label: '通用模型',
      models: models.value.filter(
        (item) =>
          item.model.platform !== AiImagePlatformEnum.DOU_BAO &&
          item.model.platform !== AiImagePlatformEnum.MIDJOURNEY,
      ),
    },
    {
      label: 'Seedream',
      models: models.value.filter(
        (item) => item.model.platform === AiImagePlatformEnum.DOU_BAO,
      ),
    },
    {
      label: 'Midjourney',
      models: models.value.filter(
        (item) => item.model.platform === AiImagePlatformEnum.MIDJOURNEY,
      ),
    },
  ];
  return groups.filter((group) => group.models.length > 0);
});
/** 模型下拉的分组选项：optionRender 通过 item 读取能力标签 */
const modelOptions = computed(() =>
  modelGroups.value.map((group) => ({
    label: group.label,
    options: group.models.map((item) => ({
      label: item.model.name,
      value: item.model.id,
      disabled: !!item.disabledReason,
      item,
    })),
  })),
);
const disabledModels = computed(() =>
  models.value.filter((item) => item.disabledReason),
);

/** 构建模型的下拉项：能力标签、不可选原因 */
function buildModelItem(model: AiModelModelApi.Model): ModelItem {
  if (model.platform === AiImagePlatformEnum.MIDJOURNEY) {
    return { model, tags: ['五种模式', '按钮动作'] };
  }
  const capability = getImageModelCapability(model.platform, model.model);
  if (!capability) {
    return { model, disabledReason: DOU_BAO_UNREGISTERED, tags: [] };
  }
  const tags: string[] = [];
  if (capability.reference.max > 0) {
    tags.push(`参考图 ≤${capability.reference.max}`);
  }
  if (capability.sizeMode === 'tier') {
    tags.push((capability.tiers || []).join(' / '));
  } else if (capability.custom) {
    tags.push('自定义宽高');
  }
  return {
    model,
    disabledReason: capability.status?.blocked,
    legacy: !!capability.status?.legacy,
    unregistered: !IMAGE_MODEL_CAPABILITIES[`${model.platform}:${model.model}`],
    tags,
  };
}

/** 提交成功：回到我的作品第 1 页 */
const worksRef = ref<InstanceType<typeof Works>>();
function handleSubmitted() {
  worksRef.value?.refreshMine();
}

/** 重新生成：切换到原模型，回填参数 */
const drawFormRef = ref<InstanceType<typeof DrawForm>>();
const midjourneyFormRef = ref<InstanceType<typeof MidjourneyForm>>();
async function handleRegenerate(image: AiImageApi.Image) {
  const item =
    models.value.find((item) => item.model.id === image.modelId) ||
    models.value.find(
      (item) =>
        item.model.platform === image.platform &&
        item.model.model === image.model,
    );
  if (!item || item.disabledReason) {
    message.warning('原模型已不可用，请重新选择模型');
    return;
  }
  modelId.value = item.model.id;
  await nextTick();
  if (isMidjourney.value) {
    midjourneyFormRef.value?.setValues(image);
  } else {
    drawFormRef.value?.setValues(image);
  }
}

/** 加载绘图模型：默认选中第一个可用模型 */
async function loadModels() {
  modelsError.value = false;
  try {
    const list = await getModelSimpleList(AiModelTypeEnum.IMAGE);
    models.value = list
      .filter((model) => isImagePlatform(model.platform))
      .map((model) => buildModelItem(model));
    if (!models.value.some((item) => item.model.id === modelId.value)) {
      modelId.value = models.value.find(
        (item) => !item.disabledReason,
      )?.model.id;
    }
  } catch {
    modelsError.value = true;
  } finally {
    modelsLoaded.value = true;
  }
}

/** 初始化 */
onMounted(() => {
  loadModels();
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full gap-4 overflow-hidden">
      <!-- 左：模型 + 创作表单（纵向 flex：参数区自己滚动，生成按钮在底部独占一行） -->
      <Card
        class="h-full w-[420px] flex-shrink-0"
        :styles="{
          body: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          },
        }"
      >
        <div class="mb-4">
          <div class="text-base font-bold">AI 绘图</div>
          <div class="mt-1 text-xs text-gray-500">
            选择模型后，表单按模型能力显示可用的参数
          </div>
        </div>
        <Form layout="vertical">
          <FormItem label="模型">
            <Select
              v-model:value="modelId"
              :options="modelOptions"
              placeholder="请选择绘图模型"
              show-search
              option-filter-prop="label"
              class="w-full"
            >
              <template #optionRender="{ option }">
                <div class="flex items-center justify-between gap-2">
                  <span class="truncate">{{ option.data.label }}</span>
                  <span class="flex flex-shrink-0 items-center gap-1">
                    <Tag v-if="option.data.item.disabledReason" class="!mr-0">
                      不可用
                    </Tag>
                    <Tag
                      v-else-if="option.data.item.legacy"
                      color="warning"
                      class="!mr-0"
                    >
                      legacy
                    </Tag>
                    <Tag
                      v-else-if="option.data.item.unregistered"
                      class="!mr-0"
                    >
                      未登记 · 仅文生图
                    </Tag>
                    <Tag
                      v-for="tag in option.data.item.tags"
                      :key="tag"
                      color="blue"
                      class="!mr-0"
                    >
                      {{ tag }}
                    </Tag>
                  </span>
                </div>
              </template>
            </Select>
            <div v-if="modelsError" class="text-xs text-red-500">
              模型列表加载失败
              <Button type="link" size="small" @click="loadModels">
                重试
              </Button>
            </div>
            <div
              v-else-if="modelsLoaded && modelGroups.length === 0"
              class="text-xs text-orange-500"
            >
              没有可用的绘图模型，请先在「模型配置」启用绘图模型
            </div>
            <div
              v-for="item in disabledModels"
              :key="item.model.id"
              class="text-xs leading-[18px] text-gray-500"
            >
              {{ item.model.name }}：{{ item.disabledReason }}
            </div>
          </FormItem>
        </Form>
        <MidjourneyForm
          v-if="selectedModel && isMidjourney"
          ref="midjourneyFormRef"
          :model="selectedModel"
          @submitted="handleSubmitted"
        />
        <DrawForm
          v-else-if="selectedModel && selectedCapability"
          ref="drawFormRef"
          :key="selectedModel.id"
          :model="selectedModel"
          :capability="selectedCapability"
          @submitted="handleSubmitted"
        />
      </Card>

      <!-- 右：我的作品 / 公开画廊 -->
      <Works
        ref="worksRef"
        class="h-full min-w-0 flex-1"
        @regenerate="handleRegenerate"
      />
    </div>
  </Page>
</template>
