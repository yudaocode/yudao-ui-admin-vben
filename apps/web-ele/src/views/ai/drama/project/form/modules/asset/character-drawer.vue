<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { AiDramaAssetApi } from '#/api/ai/drama/asset';

import { computed, reactive, ref, watch } from 'vue';

import { confirm, useVbenDrawer } from '@vben/common-ui';
import {
  AiDramaAudioTypeEnum,
  AiDramaStatusEnum,
  DICT_TYPE,
  isAiDramaRunning,
} from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElDivider,
  ElInput,
  ElMessage,
  ElTag,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createDramaAppearance,
  createDramaAudio,
  createDramaCharacter,
  deleteDramaAppearance,
  deleteDramaAppearanceCandidate,
  deleteDramaAudio,
  generateDramaAppearanceImage,
  selectDramaAudio,
  undoDramaAppearanceImage,
  updateDramaAppearance,
  updateDramaCharacter,
} from '#/api/ai/drama/asset';
import { FileUpload } from '#/components/upload';

import AssetImage from '../../../../components/asset-image.vue';
import AudioGenerateForm from './audio-generate-form.vue';

/** AI 短剧：角色详情，基本信息、形象版本、样音 */
defineOptions({ name: 'AiDramaCharacterDrawer' });

const props = defineProps<{
  characters: AiDramaAssetApi.Character[];
  imageModelId?: number;
  projectId: number;
}>();
const emit = defineEmits<{ refresh: [] }>();

const characterId = ref<number>(); // 编辑中的角色编号；为空表示新增
const character = computed(() =>
  props.characters.find((item) => item.id === characterId.value),
);
const saving = ref(false); // 是否保存中
const uploadAudioUrl = ref(''); // 待保存的上传样音

/** 基本信息表单配置 */
function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '角色名称',
      component: 'Input',
      componentProps: { maxlength: 64, placeholder: '请输入角色名称' },
      formItemClass: 'col-span-1',
      rules: 'required',
    },
    {
      fieldName: 'aliases',
      label: '别名',
      component: 'Input',
      componentProps: { maxlength: 255, placeholder: '多个用逗号分隔' },
      formItemClass: 'col-span-1',
    },
    {
      fieldName: 'roleLevel',
      label: '角色等级',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.AI_DRAMA_CHARACTER_ROLE_LEVEL),
        placeholder: '请选择角色等级',
      },
      formItemClass: 'col-span-1',
    },
    {
      fieldName: 'sex',
      label: '性别',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number'),
        placeholder: '请选择性别',
      },
      formItemClass: 'col-span-1',
    },
    {
      fieldName: 'ageRange',
      label: '年龄段',
      component: 'Input',
      componentProps: { maxlength: 32, placeholder: '例如：25-30 岁' },
      formItemClass: 'col-span-1',
    },
    {
      fieldName: 'costumeTier',
      label: '服装档次',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(
          DICT_TYPE.AI_DRAMA_CHARACTER_COSTUME_TIER,
          'number',
        ),
        placeholder: '请选择服装档次',
      },
      formItemClass: 'col-span-1',
    },
    {
      fieldName: 'personalityTags',
      label: '性格标签',
      component: 'Select',
      componentProps: {
        allowCreate: true,
        clearable: true,
        defaultFirstOption: true,
        filterable: true,
        multiple: true,
        placeholder: '输入后回车添加',
      },
    },
    {
      fieldName: 'description',
      label: '角色设定',
      component: 'Textarea',
      componentProps: {
        maxlength: 2000,
        rows: 3,
        placeholder: '年龄、外貌、性格、服装',
      },
    },
    {
      fieldName: 'prompt',
      label: '出图提示词',
      component: 'Textarea',
      componentProps: {
        maxlength: 2000,
        rows: 3,
        placeholder: '为空时使用角色设定',
      },
    },
    {
      fieldName: 'referenceImageUrl',
      label: '参考图',
      component: 'ImageUpload',
      componentProps: {
        maxSize: 10,
        showDescription: false,
        directory: 'ai/drama',
      },
      help: 'Seedream 出图时作为参考',
    },
    {
      fieldName: 'voiceDescription',
      label: '声音描述',
      component: 'Input',
      componentProps: {
        maxlength: 500,
        placeholder: '例如：低沉、沙哑的中年男声',
      },
    },
    {
      fieldName: 'sampleText',
      label: '样音文本',
      component: 'Input',
      componentProps: {
        maxlength: 500,
        placeholder: '生成样音时朗读的文本',
      },
    },
  ];
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

const [Drawer, drawerApi] = useVbenDrawer({
  showConfirmButton: false,
  cancelText: '关 闭',
  class: 'w-[640px]',
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 编辑时复制一份角色（含性格标签），修改不影响列表
    const id = drawerApi.getData() as number | undefined;
    characterId.value = id;
    uploadAudioUrl.value = '';
    await formApi.resetForm();
    const item = props.characters.find((c) => c.id === id);
    await formApi.setValues({
      name: item?.name || '',
      aliases: item?.aliases || '',
      roleLevel: item?.roleLevel,
      sex: item?.sex,
      ageRange: item?.ageRange || '',
      personalityTags: [...(item?.personalityTags || [])],
      costumeTier: item?.costumeTier,
      description: item?.description || '',
      prompt: item?.prompt || '',
      referenceImageUrl: item?.referenceImageUrl || '',
      voiceDescription: item?.voiceDescription || '',
      sampleText: item?.sampleText || '',
    });
  },
});

/** 打开：不传编号时为新增 */
function open(id?: number) {
  drawerApi.setData(id).open();
}
defineExpose({ open });

/** 保存角色：新增后抽屉不关闭，继续编辑形象、样音 */
async function handleSave() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  saving.value = true;
  try {
    const data = {
      ...(await formApi.getValues()),
      id: characterId.value,
      projectId: props.projectId,
    } as AiDramaAssetApi.CharacterSaveReq;
    if (data.id) {
      await updateDramaCharacter(data);
    } else {
      characterId.value = await createDramaCharacter(data);
    }
    ElMessage.success('保存成功');
    emit('refresh');
  } finally {
    saving.value = false;
  }
}

// ========== 形象 ==========

// 形象设定的编辑表单：按形象编号，轮询刷新时不覆盖正在编辑的内容
const appearanceForms = reactive<
  Record<number, { changeReason?: string; description?: string }>
>({});
watch(
  () => character.value?.appearances,
  (appearances) => {
    appearances?.forEach((item) => {
      if (!appearanceForms[item.id]) {
        appearanceForms[item.id] = {
          description: item.description,
          changeReason: item.changeReason,
        };
      }
    });
  },
  { immediate: true },
);

/** 新增形象 */
async function handleCreateAppearance() {
  await createDramaAppearance({ characterId: characterId.value });
  emit('refresh');
}

/** 保存形象设定 */
async function handleSaveAppearance(appearance: AiDramaAssetApi.Appearance) {
  await updateDramaAppearance({
    id: appearance.id,
    ...appearanceForms[appearance.id],
  });
  ElMessage.success('保存成功');
  emit('refresh');
}

/** 选用候选图 */
async function handleSelectCandidate(
  appearance: AiDramaAssetApi.Appearance,
  index: number,
) {
  await updateDramaAppearance({
    id: appearance.id,
    ...appearanceForms[appearance.id],
    selectedIndex: index,
  });
  emit('refresh');
}

/** 删除一张候选图：删除前的候选图记为上一版，可撤销 */
async function handleDeleteCandidate(
  appearance: AiDramaAssetApi.Appearance,
  index: number,
) {
  try {
    await confirm('删除这张候选图后，可通过「撤销」恢复，是否继续？');
  } catch {
    return;
  }
  await deleteDramaAppearanceCandidate(appearance.id, index);
  ElMessage.success('删除成功');
  emit('refresh');
}

/** 撤销上次的候选图变更：恢复为上一版候选图 */
async function handleUndoImage(id: number) {
  await undoDramaAppearanceImage(id);
  ElMessage.success('已撤销');
  emit('refresh');
}

/** 出图 */
async function handleGenerateImage(id: number) {
  await generateDramaAppearanceImage(id, props.imageModelId!);
  ElMessage.success('已提交出图');
  emit('refresh');
}

/** 删除形象 */
async function handleDeleteAppearance(id: number) {
  try {
    await confirm('确认删除该形象吗？');
  } catch {
    return;
  }
  await deleteDramaAppearance(id);
  ElMessage.success('删除成功');
  emit('refresh');
}

// ========== 样音 ==========

/** 保存上传的样音 */
async function handleUploadAudio() {
  await createDramaAudio({
    projectId: props.projectId,
    characterId: characterId.value,
    type: AiDramaAudioTypeEnum.SAMPLE,
    fileUrl: uploadAudioUrl.value,
  });
  uploadAudioUrl.value = '';
  ElMessage.success('保存成功');
  emit('refresh');
}

/** 选用样音 */
async function handleSelectAudio(id: number) {
  await selectDramaAudio(id);
  emit('refresh');
}

/** 删除样音 */
async function handleDeleteAudio(id: number) {
  try {
    await confirm('确认删除该样音吗？');
  } catch {
    return;
  }
  await deleteDramaAudio(id);
  ElMessage.success('删除成功');
  emit('refresh');
}
</script>

<template>
  <Drawer :title="characterId ? `角色：${character?.name || ''}` : '新增角色'">
    <!-- 基本信息 -->
    <Form class="mx-2" />
    <div class="mb-4 flex justify-end">
      <ElButton type="primary" :loading="saving" @click="handleSave">保存</ElButton>
    </div>

    <template v-if="character">
      <!-- 形象版本 -->
      <ElDivider content-position="left">形象版本</ElDivider>
      <div
        v-for="appearance in character.appearances"
        :key="appearance.id"
        class="border-border mb-4 rounded-md border p-3"
      >
        <div class="mb-2 flex items-center justify-between">
          <span class="font-medium">形象 {{ appearance.appearanceIndex }}</span>
          <div>
            <ElButton
              link
              type="primary"
              :disabled="!imageModelId || isAiDramaRunning(appearance.status)"
              @click="handleGenerateImage(appearance.id)"
            >
              {{ isAiDramaRunning(appearance.status) ? '生成中' : '出图' }}
            </ElButton>
            <ElButton
              v-if="appearance.previousImageUrls"
              link
              type="primary"
              :disabled="isAiDramaRunning(appearance.status)"
              @click="handleUndoImage(appearance.id)"
            >
              撤销
            </ElButton>
            <ElButton link type="primary" @click="handleSaveAppearance(appearance)">
              保存设定
            </ElButton>
            <ElButton
              link
              type="danger"
              @click="handleDeleteAppearance(appearance.id)"
            >
              删除
            </ElButton>
          </div>
        </div>
        <ElInput
          v-if="appearance.appearanceIndex > 0"
          v-model="appearanceForms[appearance.id]!.changeReason"
          placeholder="形象变化原因，例如：落水后换装"
          :maxlength="255"
          class="mb-2"
        />
        <ElInput
          v-model="appearanceForms[appearance.id]!.description"
          type="textarea"
          :rows="2"
          placeholder="形象设定，例如：雨夜，湿透的风衣"
          :maxlength="2000"
          class="mb-2"
        />
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(url, index) in appearance.imageUrls || []"
            :key="url + index"
            class="relative cursor-pointer rounded-md p-0.5"
            :class="
              appearance.selectedIndex === index
                ? 'outline-[var(--el-color-primary)] outline outline-2'
                : ''
            "
            @click="handleSelectCandidate(appearance, index)"
          >
            <AssetImage :url="url" size="88px" />
            <IconifyIcon
              icon="lucide:circle-x"
              class="text-destructive absolute right-1 top-1 size-4"
              @click.stop="handleDeleteCandidate(appearance, index)"
            />
          </div>
          <!-- 生成中、已失败：占位 -->
          <AssetImage
            v-if="
              isAiDramaRunning(appearance.status) ||
              appearance.status === AiDramaStatusEnum.FAIL
            "
            :status="appearance.status"
            :error-message="appearance.errorMessage"
            size="88px"
          />
          <span
            v-else-if="!appearance.imageUrls?.length"
            class="text-muted-foreground text-xs"
          >
            还没有候选图，选择绘画模型后点击「出图」
          </span>
        </div>
      </div>
      <ElButton @click="handleCreateAppearance">
        <IconifyIcon icon="lucide:plus" class="mr-1 size-4" />
        新增形象
      </ElButton>

      <!-- 样音 -->
      <ElDivider content-position="left">样音</ElDivider>
      <div class="text-muted-foreground mb-2 text-xs">
        选用的样音，会作为该角色台词的参考音频，用于支持参考音频的视频模型
      </div>
      <div
        v-for="audio in character.audios"
        :key="audio.id"
        class="mb-2 flex items-center gap-2"
      >
        <audio :src="audio.fileUrl" controls class="h-8 flex-1"></audio>
        <ElTag v-if="audio.id === character.sampleAudioId" type="success">
          已选用
        </ElTag>
        <ElButton v-else link type="primary" @click="handleSelectAudio(audio.id)">
          选用
        </ElButton>
        <ElButton link type="danger" @click="handleDeleteAudio(audio.id)">
          删除
        </ElButton>
      </div>
      <div class="mb-3 flex items-start gap-2">
        <FileUpload
          v-model="uploadAudioUrl"
          :accept="['mp3', 'wav', 'm4a']"
          :max-size="20"
          :max-number="1"
          :show-description="false"
          directory="ai/drama"
        />
        <ElButton :disabled="!uploadAudioUrl" @click="handleUploadAudio">
          保存上传的样音
        </ElButton>
      </div>
      <AudioGenerateForm
        :key="character.id"
        :project-id="projectId"
        :character-id="character.id"
        :default-text="character.sampleText || '你好，很高兴认识你。'"
        @success="emit('refresh')"
      />
    </template>
  </Drawer>
</template>
