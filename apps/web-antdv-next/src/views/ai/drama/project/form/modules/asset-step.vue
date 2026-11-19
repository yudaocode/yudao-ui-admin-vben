<script lang="ts" setup>
import type { AiDramaAssetApi } from '#/api/ai/drama/asset';
import type { AiDramaProjectApi } from '#/api/ai/drama/project';
import type { AiModelModelApi } from '#/api/ai/model/model';

import { computed, onMounted, ref } from 'vue';

import { confirm } from '@vben/common-ui';
import {
  AiDramaStepEnum,
  AiModelTypeEnum,
  AiPlatformEnum,
  isAiDramaRunning,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  Empty,
  message,
  Select,
  TabPane,
  Tabs,
} from 'antdv-next';

import {
  deleteDramaCharacter,
  deleteDramaLocation,
  deleteDramaVisualAsset,
  generateDramaAppearanceImage,
  generateDramaLocationImage,
  generateDramaMissingImages,
  generateDramaVisualAssetImage,
  undoDramaLocationImage,
  undoDramaVisualAssetImage,
} from '#/api/ai/drama/asset';
import { getModelSimpleList } from '#/api/ai/model/model';
import {
  getDramaProps,
  getSelectedImageUrl,
  hasDramaArchive,
} from '#/views/ai/utils/drama';

import AssetImage from '../../../components/asset-image.vue';
import CharacterDrawer from './asset/character-drawer.vue';
import LocationForm from './asset/location-form.vue';
import PropForm from './asset/prop-form.vue';

/** AI 短剧：第 3 步，资产配置（角色、场景、道具） */
defineOptions({ name: 'AiDramaAssetStep' });

const props = defineProps<{ detail: AiDramaProjectApi.ProjectDetail }>();
const emit = defineEmits<{ next: [step: number]; refresh: [] }>();

const activeTab = ref('character'); // 当前标签
const characterDrawerRef = ref<InstanceType<typeof CharacterDrawer>>();
const locationFormRef = ref<InstanceType<typeof LocationForm>>();
const propFormRef = ref<InstanceType<typeof PropForm>>();

// ========== 绘画模型、出图 ==========

const imageModels = ref<AiModelModelApi.Model[]>([]); // 绘画模型
const imageModelId = ref<number>(); // 选中的绘画模型
const generatingMissing = ref(false); // 是否批量补图中

/** 当前的道具：不含关键帧、历史版本 */
const propList = computed(() => getDramaProps(props.detail.visualAssets));

/** 当前分镜的镜头序号：道具关联镜头时选择 */
const sceneNos = computed(() =>
  props.detail.storyboards
    .filter((item) => item.scriptId === props.detail.script?.id && item.sceneNo)
    .map((item) => item.sceneNo!),
);

/** 已出图的数量 */
const readiness = computed(() => {
  const appearances = props.detail.characters.flatMap(
    (item) => item.appearances,
  );
  const count = <T,>(list: T[], done: (item: T) => boolean) =>
    `${list.filter((item) => done(item)).length}/${list.length}`;
  return {
    appearance: count(appearances, (item) => !!item.imageUrls?.length),
    location: count(props.detail.locations, (item) => !!item.imageUrls?.length),
    prop: count(propList.value, (item) => !!item.imageUrl),
  };
});

/** 出图 */
async function handleGenerate(
  type: 'appearance' | 'location' | 'visual_asset',
  id: number,
) {
  const modelId = imageModelId.value!;
  if (type === 'appearance') {
    await generateDramaAppearanceImage(id, modelId);
  } else if (type === 'location') {
    await generateDramaLocationImage(id, modelId);
  } else {
    await generateDramaVisualAssetImage(id, modelId);
  }
  message.success('已提交出图');
  emit('refresh');
}

/** 撤销上次出图：场景恢复上一版候选图，道具与最近的历史版本互换 */
async function handleUndo(type: 'location' | 'visual_asset', id: number) {
  try {
    await confirm('撤销后恢复为上一版图片，是否继续？');
  } catch {
    return;
  }
  await (type === 'location'
    ? undoDramaLocationImage(id)
    : undoDramaVisualAssetImage(id));
  message.success('已撤销');
  emit('refresh');
}

/** 一键补齐图片 */
async function handleGenerateMissing() {
  generatingMissing.value = true;
  try {
    const count = await generateDramaMissingImages(
      props.detail.project.id,
      imageModelId.value!,
    );
    message.success(count ? `已提交 ${count} 个出图任务` : '没有需要补齐的图片');
    emit('refresh');
  } finally {
    generatingMissing.value = false;
  }
}

// ========== 角色 ==========

/** 获得角色选用的样音 */
function getSelectedAudio(character: AiDramaAssetApi.Character) {
  return character.audios.find((item) => item.id === character.sampleAudioId)
    ?.fileUrl;
}

/** 删除角色 */
async function handleDeleteCharacter(id: number) {
  try {
    await confirm('删除角色会一并删除其形象与样音，是否继续？');
  } catch {
    return;
  }
  await deleteDramaCharacter(id);
  message.success('删除成功');
  emit('refresh');
}

// ========== 场景 ==========

/** 删除场景 */
async function handleDeleteLocation(id: number) {
  try {
    await confirm('确认删除该场景吗？');
  } catch {
    return;
  }
  await deleteDramaLocation(id);
  message.success('删除成功');
  emit('refresh');
}

// ========== 道具 ==========

/** 删除道具 */
async function handleDeleteProp(id: number) {
  try {
    await confirm('确认删除该道具吗？');
  } catch {
    return;
  }
  await deleteDramaVisualAsset(id);
  message.success('删除成功');
  emit('refresh');
}

/** 初始化：Midjourney 不支持，不展示 */
onMounted(async () => {
  imageModels.value = (await getModelSimpleList(AiModelTypeEnum.IMAGE)).filter(
    (item) => item.platform !== AiPlatformEnum.MIDJOURNEY,
  );
  imageModelId.value = imageModels.value[0]?.id;
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <Card>
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-sm">绘画模型</span>
        <Select
          v-model:value="imageModelId"
          :options="imageModels"
          :field-names="{ label: 'name', value: 'id' }"
          option-filter-prop="name"
          placeholder="请选择绘画模型"
          show-search
          class="w-60"
        />
        <Button
          :disabled="!imageModelId"
          :loading="generatingMissing"
          @click="handleGenerateMissing"
        >
          一键补齐图片
        </Button>
        <span class="text-muted-foreground text-xs">
          已出图：角色形象 {{ readiness.appearance }}，场景
          {{ readiness.location }}，道具 {{ readiness.prop }}
        </span>
        <div class="flex-1"></div>
        <Button type="primary" @click="emit('next', AiDramaStepEnum.STORYBOARD)">
          下一步：分镜与成片 →
        </Button>
      </div>
    </Card>

    <Card>
      <Tabs v-model:active-key="activeTab">
        <!-- 角色 -->
        <TabPane
          key="character"
          :tab="`角色（${detail.characters.length}）`"
        >
          <Button class="mb-3" @click="characterDrawerRef?.open()">
            <IconifyIcon icon="lucide:plus" class="mr-1 size-4" />
            新增角色
          </Button>
          <Empty
            v-if="!detail.characters.length"
            description="暂无角色，可在剧本步骤「分析资产」自动提取"
          />
          <div
            class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3"
          >
            <Card
              v-for="character in detail.characters"
              :key="character.id"
              size="small"
            >
              <div class="mb-2 flex items-center justify-between">
                <span class="font-medium">{{ character.name }}</span>
                <div>
                  <Button
                    type="link"
                    size="small"
                    @click="characterDrawerRef?.open(character.id)"
                  >
                    详情
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    danger
                    @click="handleDeleteCharacter(character.id)"
                  >
                    删除
                  </Button>
                </div>
              </div>
              <div class="text-muted-foreground mb-2 line-clamp-2 text-xs">
                {{ character.description || '暂无设定' }}
              </div>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="appearance in character.appearances"
                  :key="appearance.id"
                  class="text-center"
                >
                  <AssetImage
                    :url="
                      getSelectedImageUrl(
                        appearance.imageUrls,
                        appearance.selectedIndex,
                      )
                    "
                    :status="appearance.status"
                    :error-message="appearance.errorMessage"
                    size="80px"
                  />
                  <div class="mt-0.5 text-xs">
                    形象 {{ appearance.appearanceIndex }}
                    <Button
                      type="link"
                      size="small"
                      :disabled="
                        !imageModelId || isAiDramaRunning(appearance.status)
                      "
                      @click="handleGenerate('appearance', appearance.id)"
                    >
                      出图
                    </Button>
                  </div>
                </div>
              </div>
              <div class="mt-2 flex items-center gap-2 text-xs">
                <span class="text-muted-foreground">样音</span>
                <audio
                  v-if="getSelectedAudio(character)"
                  :src="getSelectedAudio(character)"
                  controls
                  class="h-7 flex-1"
                ></audio>
                <span v-else class="text-muted-foreground">未选用</span>
              </div>
            </Card>
          </div>
        </TabPane>

        <!-- 场景 -->
        <TabPane key="location" :tab="`场景（${detail.locations.length}）`">
          <Button class="mb-3" @click="locationFormRef?.open()">
            <IconifyIcon icon="lucide:plus" class="mr-1 size-4" />
            新增场景
          </Button>
          <Empty v-if="!detail.locations.length" description="暂无场景" />
          <div
            class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3"
          >
            <Card
              v-for="location in detail.locations"
              :key="location.id"
              size="small"
            >
              <AssetImage
                :url="
                  getSelectedImageUrl(location.imageUrls, location.selectedIndex)
                "
                :status="location.status"
                :error-message="location.errorMessage"
                size="100%"
                class="aspect-square"
              />
              <div class="mt-1.5 truncate font-medium">{{ location.name }}</div>
              <div class="mt-1 flex flex-wrap justify-end">
                <Button
                  type="link"
                  size="small"
                  :disabled="!imageModelId || isAiDramaRunning(location.status)"
                  @click="handleGenerate('location', location.id)"
                >
                  出图
                </Button>
                <Button
                  v-if="location.previousImageUrls"
                  type="link"
                  size="small"
                  :disabled="isAiDramaRunning(location.status)"
                  @click="handleUndo('location', location.id)"
                >
                  撤销
                </Button>
                <Button
                  type="link"
                  size="small"
                  @click="locationFormRef?.open(location)"
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  @click="handleDeleteLocation(location.id)"
                >
                  删除
                </Button>
              </div>
            </Card>
          </div>
        </TabPane>

        <!-- 道具 -->
        <TabPane key="prop" :tab="`道具（${propList.length}）`">
          <Button class="mb-3" @click="propFormRef?.open()">
            <IconifyIcon icon="lucide:plus" class="mr-1 size-4" />
            新增道具
          </Button>
          <Empty v-if="!propList.length" description="暂无道具" />
          <div
            class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3"
          >
            <Card v-for="asset in propList" :key="asset.id" size="small">
              <AssetImage
                :url="asset.imageUrl"
                :status="asset.status"
                :error-message="asset.errorMessage"
                size="100%"
                class="aspect-square"
              />
              <div class="mt-1.5 truncate font-medium">{{ asset.title }}</div>
              <div class="text-muted-foreground truncate text-xs">
                镜头：{{
                  asset.referenceImages?.shotNumbers?.join('、') || '未关联'
                }}
              </div>
              <div class="mt-1 flex flex-wrap justify-end">
                <Button
                  v-if="hasDramaArchive(detail.visualAssets, asset.id)"
                  type="link"
                  size="small"
                  :disabled="isAiDramaRunning(asset.status)"
                  @click="handleUndo('visual_asset', asset.id)"
                >
                  撤销
                </Button>
                <Button
                  type="link"
                  size="small"
                  :disabled="!imageModelId || isAiDramaRunning(asset.status)"
                  @click="handleGenerate('visual_asset', asset.id)"
                >
                  出图
                </Button>
                <Button
                  type="link"
                  size="small"
                  @click="propFormRef?.open(asset)"
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  @click="handleDeleteProp(asset.id)"
                >
                  删除
                </Button>
              </div>
            </Card>
          </div>
        </TabPane>
      </Tabs>
    </Card>

    <CharacterDrawer
      ref="characterDrawerRef"
      :project-id="detail.project.id"
      :characters="detail.characters"
      :image-model-id="imageModelId"
      @refresh="emit('refresh')"
    />
    <LocationForm
      ref="locationFormRef"
      :project-id="detail.project.id"
      :locations="detail.locations"
      @success="emit('refresh')"
    />
    <PropForm
      ref="propFormRef"
      :project-id="detail.project.id"
      :scene-nos="sceneNos"
      @success="emit('refresh')"
    />
  </div>
</template>
