<script lang="ts" setup>
import type {
  ActionClip,
  DirectorAction,
  DirectorDocument,
  DirectorEase,
  DirectorJoint,
  Vec3,
} from '../director';

import { computed, nextTick, reactive, ref, watch } from 'vue';

import {
  ElAlert,
  ElButton,
  ElCheckbox,
  ElColorPicker,
  ElDivider,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElSlider,
  ElSwitch,
} from 'element-plus';

import {
  cameraAt,
  cloneDirector,
  directorActions,
  directorEases,
  directorJoints,
  directorKinds,
  objectAt,
  totalFrames,
} from '../director';

/** AI 短剧 3D 导演：右侧属性，场景对象（当前帧的位置、动作、姿态、动作片段）或摄影机（机位、跟随） */
defineOptions({ name: 'AiDramaDirectorInspector' });

const props = defineProps<{
  canPaste: boolean;
  document: DirectorDocument;
  frame: number;
  joint: DirectorJoint;
  selected: string;
  selectedClip: string;
}>();
const emit = defineEmits([
  'patchObject',
  'patchKey',
  'patchCamera',
  'deleteKey',
  'remove',
  'duplicate',
  'joint',
  'jointRotation',
  'copyPose',
  'pastePose',
  'mirrorPose',
  'addClip',
  'patchClip',
  'removeClip',
  'follow',
  'patchFollow',
]);

const AXES = [0, 1, 2] as const;
const CAMERA_VECTORS = [
  { key: 'position', label: '机位（米）' },
  { key: 'target', label: '拍摄目标（米）' },
] as const;
const CLIP_FIELDS: {
  key: 'blend' | 'end' | 'speed' | 'start' | 'strength';
  label: string;
  max: number;
  min: number;
  step: number;
}[] = [
  { key: 'start', label: '开始帧', min: 0, max: 1440, step: 1 },
  { key: 'end', label: '结束帧', min: 1, max: 1440, step: 1 },
  { key: 'blend', label: '过渡帧', min: 0, max: 720, step: 1 },
  { key: 'speed', label: '速度', min: 0.25, max: 3, step: 0.05 },
  { key: 'strength', label: '幅度', min: 0, max: 1.5, step: 0.05 },
];

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ label, value }));
const actionOptions = toOptions(directorActions);
const easeOptions = toOptions(directorEases);
const jointOptions = toOptions(directorJoints);

const clipAction = ref<DirectorAction>('walk');

const end = computed(() => totalFrames(props.document) - 1);
const object = computed(() =>
  props.document.objects.find((item) => item.id === props.selected),
);
const others = computed(() =>
  props.document.objects.filter((item) => item.id !== props.selected),
);
const followOptions = computed(() => [
  { label: '不跟随', value: '' },
  ...props.document.objects.map((item) => ({
    label: item.name,
    value: item.id,
  })),
]);
const lookAtOptions = computed(() => [
  { label: '不注视', value: '' },
  ...others.value.map((item) => ({ label: item.name, value: item.id })),
]);

/**
 * 编辑中的属性：输入框双向绑定这里，修改完成（change：失焦或回车）时提交到导演工程；
 * 工程、选中对象、当前帧变化时按工程重新填充，校验未通过时也回到工程中的实际值
 */
const formData = reactive({
  name: '',
  color: '',
  visible: true,
  locked: false,
  scale: [1, 1, 1] as Vec3,
  autoFace: false,
  lookAtId: '',
  position: [0, 0, 0] as Vec3,
  yaw: 0,
  action: 'idle' as DirectorAction,
  ease: 'linear' as DirectorEase,
  jointRotation: [0, 0, 0] as Vec3,
  clips: [] as ActionClip[],
  camera: {
    position: [0, 0, 0] as Vec3,
    target: [0, 0, 0] as Vec3,
    fov: 45,
    roll: 0,
    ease: 'linear' as DirectorEase,
  },
  follow: { objectId: '', mode: 'aim' as 'aim' | 'follow', height: 0 },
});

/** 最近一次按工程填充的表单内容：输入框失焦时，与它相同说明没有修改，不提交 */
let baseline = '';

function resetFormData() {
  const item = object.value;
  if (item) {
    const key = objectAt(item, props.frame);
    Object.assign(formData, {
      name: item.name,
      color: item.color,
      visible: item.visible,
      locked: item.locked,
      scale: [...item.scale],
      autoFace: !!item.autoFace,
      lookAtId: item.lookAtId || '',
      position: [...key.position],
      yaw: key.yaw,
      action: key.action,
      ease: key.ease || 'linear',
      jointRotation: [...(key.pose?.[props.joint] || [0, 0, 0])],
      clips: cloneDirector(item.clips || []),
    });
  }
  const camera = cameraAt(props.document, props.frame);
  const follow = props.document.camera.follow;
  formData.camera = {
    position: [...camera.position],
    target: [...camera.target],
    fov: camera.fov,
    roll: camera.roll,
    ease: camera.ease || 'linear',
  };
  formData.follow = {
    objectId: follow?.objectId || '',
    mode: follow?.mode || 'aim',
    height: follow?.height ?? 0,
  };
  baseline = JSON.stringify(formData);
}
watch(
  () => [props.document, props.selected, props.frame, props.joint],
  resetFormData,
  { immediate: true },
);

/** 提交修改：父组件更新工程后重新填充，校验未通过（工程未变）时回到实际值 */
function commit(event: string, ...args: any[]) {
  emit(event as any, ...args);
  nextTick(resetFormData);
}

/** 输入框修改完成（失焦或回车）：内容有修改时才提交 */
function commitInput(event: string, ...args: any[]) {
  if (JSON.stringify(formData) !== baseline) {
    commit(event, ...args);
  }
}

function handleColorChange() {
  commit('patchObject', { color: formData.color || object.value?.color });
}
</script>

<template>
  <div
    class="border-border bg-card h-full w-[320px] shrink-0 overflow-y-auto border-l border-solid"
  >
    <!-- 摄影机 -->
    <ElForm
      v-if="selected === 'camera'"
      :model="formData"
      label-position="top"
      size="small"
      class="p-3"
    >
      <div class="mb-2 text-sm font-semibold">摄影机 · 第 {{ frame }} 帧</div>
      <ElFormItem
        v-for="field in CAMERA_VECTORS"
        :key="field.key"
        :label="field.label"
        class="!mb-3"
      >
        <div class="flex gap-1">
          <ElInputNumber
            v-for="i in AXES"
            :key="i"
            v-model="formData.camera[field.key][i]"
            :step="0.1"
            :min="-100"
            :max="100"
            :controls="false"
            class="!w-1/3"
            @change="
              commitInput('patchCamera', {
                [field.key]: [...formData.camera[field.key]],
              })
            "
          />
        </div>
      </ElFormItem>
      <ElFormItem label="视角（度）" class="!mb-3">
        <ElSlider
          v-model="formData.camera.fov"
          :min="15"
          :max="100"
          @change="commit('patchCamera', { fov: formData.camera.fov })"
        />
      </ElFormItem>
      <ElFormItem label="横滚（度）" class="!mb-3">
        <ElSlider
          v-model="formData.camera.roll"
          :min="-180"
          :max="180"
          @change="commit('patchCamera', { roll: formData.camera.roll })"
        />
      </ElFormItem>
      <ElFormItem label="到下一关键帧的插值" class="!mb-3">
        <ElSelect
          v-model="formData.camera.ease"
          @change="commit('patchCamera', { ease: formData.camera.ease })"
        >
          <ElOption
            v-for="item in easeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="跟随对象" class="!mb-3">
        <ElSelect
          v-model="formData.follow.objectId"
          @change="commit('follow', formData.follow.objectId)"
        >
          <ElOption
            v-for="item in followOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
      <template v-if="document.camera.follow">
        <ElFormItem label="跟随方式" class="!mb-3">
          <ElRadioGroup
            v-model="formData.follow.mode"
            @change="commit('patchFollow', { mode: formData.follow.mode })"
          >
            <ElRadioButton value="aim">只瞄准</ElRadioButton>
            <ElRadioButton value="follow">跟拍</ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="瞄准高度（米）" class="!mb-3">
          <ElInputNumber
            v-model="formData.follow.height"
            :min="0"
            :max="3"
            :step="0.1"
            @change="
              commitInput('patchFollow', { height: formData.follow.height })
            "
          />
        </ElFormItem>
      </template>
      <ElButton :disabled="!frame" @click="emit('deleteKey')">
        删除本帧关键帧
      </ElButton>
    </ElForm>

    <!-- 场景对象 -->
    <ElForm
      v-else-if="object"
      :model="formData"
      label-position="top"
      size="small"
      class="p-3"
    >
      <div class="mb-2 flex items-center justify-between">
        <span class="text-sm font-semibold">{{
          directorKinds[object.kind]
        }}</span>
        <div>
          <ElButton link type="primary" size="small" @click="emit('duplicate')">
            复制
          </ElButton>
          <ElButton
            link
            type="danger"
            size="small"
            class="!ml-0"
            :disabled="object.locked"
            @click="emit('remove')"
          >
            删除
          </ElButton>
        </div>
      </div>
      <!-- 锁定：仍可查看全部属性，解锁后再调整 -->
      <ElAlert
        v-if="object.locked"
        type="warning"
        show-icon
        title="已锁定：可查看属性，解锁后再调整"
        :closable="false"
        class="mb-2"
      />
      <ElFormItem label="名称" class="!mb-3">
        <ElInput
          v-model="formData.name"
          :maxlength="100"
          :disabled="object.locked"
          @change="
            commitInput('patchObject', {
              name: formData.name.trim() || object.name,
            })
          "
        />
      </ElFormItem>
      <ElFormItem label="颜色 / 显示 / 锁定" class="!mb-3">
        <div class="flex items-center gap-3">
          <ElColorPicker
            v-model="formData.color"
            :disabled="object.locked"
            @change="handleColorChange"
          />
          <span class="flex items-center gap-1">
            <ElSwitch
              v-model="formData.visible"
              size="small"
              @change="commit('patchObject', { visible: formData.visible })"
            />
            显示
          </span>
          <span class="flex items-center gap-1">
            <ElSwitch
              v-model="formData.locked"
              size="small"
              @change="commit('patchObject', { locked: formData.locked })"
            />
            锁定
          </span>
        </div>
      </ElFormItem>
      <ElFormItem label="缩放" class="!mb-3">
        <div class="flex gap-1">
          <ElInputNumber
            v-for="i in AXES"
            :key="i"
            v-model="formData.scale[i]"
            :step="0.1"
            :min="0.1"
            :max="20"
            :controls="false"
            :disabled="object.locked"
            class="!w-1/3"
            @change="commitInput('patchObject', { scale: [...formData.scale] })"
          />
        </div>
      </ElFormItem>
      <ElDivider content-position="left" class="!my-3">
        第 {{ frame }} 帧
      </ElDivider>
      <ElFormItem label="位置（米）" class="!mb-3">
        <div class="flex gap-1">
          <ElInputNumber
            v-for="i in AXES"
            :key="i"
            v-model="formData.position[i]"
            :step="0.1"
            :min="-100"
            :max="100"
            :controls="false"
            :disabled="object.locked"
            class="!w-1/3"
            @change="
              commitInput('patchKey', { position: [...formData.position] })
            "
          />
        </div>
      </ElFormItem>
      <ElFormItem label="朝向（度）" class="!mb-3">
        <ElSlider
          v-model="formData.yaw"
          :min="-180"
          :max="180"
          :disabled="object.locked"
          @change="commit('patchKey', { yaw: formData.yaw })"
        />
      </ElFormItem>
      <div class="flex gap-2">
        <ElFormItem
          v-if="object.kind === 'actor'"
          label="基础动作"
          class="!mb-3 flex-1"
        >
          <ElSelect
            v-model="formData.action"
            :disabled="object.locked"
            @change="commit('patchKey', { action: formData.action })"
          >
            <ElOption
              v-for="item in actionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="插值" class="!mb-3 flex-1">
          <ElSelect
            v-model="formData.ease"
            :disabled="object.locked"
            @change="commit('patchKey', { ease: formData.ease })"
          >
            <ElOption
              v-for="item in easeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </div>
      <ElButton
        :disabled="!frame || object.locked"
        class="mb-3"
        @click="emit('deleteKey')"
      >
        删除本帧关键帧
      </ElButton>

      <!-- 人物：朝向、注视、姿态、动作片段 -->
      <template v-if="object.kind === 'actor'">
        <ElFormItem label="朝向与注视" class="!mb-3">
          <div class="w-full">
            <ElCheckbox
              v-model="formData.autoFace"
              :disabled="object.locked"
              @change="commit('patchObject', { autoFace: formData.autoFace })"
            >
              沿移动方向自动转身
            </ElCheckbox>
            <ElSelect
              v-model="formData.lookAtId"
              placeholder="注视对象"
              :disabled="object.locked"
              class="mt-1 !w-full"
              @change="
                commit('patchObject', {
                  lookAtId: formData.lookAtId || undefined,
                })
              "
            >
              <ElOption
                v-for="item in lookAtOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </div>
        </ElFormItem>
        <ElDivider content-position="left" class="!my-3">关节姿态</ElDivider>
        <ElFormItem label="关节" class="!mb-3">
          <ElSelect
            :model-value="joint"
            @change="(value) => emit('joint', value)"
          >
            <ElOption
              v-for="item in jointOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="角度 X / Y / Z（度）" class="!mb-3">
          <div class="flex gap-1">
            <ElInputNumber
              v-for="i in AXES"
              :key="i"
              v-model="formData.jointRotation[i]"
              :min="-180"
              :max="180"
              :controls="false"
              :disabled="object.locked"
              class="!w-1/3"
              @change="
                commitInput('jointRotation', joint, [...formData.jointRotation])
              "
            />
          </div>
        </ElFormItem>
        <div class="mb-3 flex flex-wrap gap-1">
          <ElButton class="!ml-0" @click="emit('copyPose')">复制姿态</ElButton>
          <ElButton
            :disabled="!canPaste || object.locked"
            class="!ml-0"
            @click="emit('pastePose')"
          >
            粘贴姿态
          </ElButton>
          <ElButton
            :disabled="object.locked"
            class="!ml-0"
            @click="emit('mirrorPose')"
          >
            左右镜像
          </ElButton>
        </div>
        <ElDivider content-position="left" class="!my-3">动作片段</ElDivider>
        <div class="mb-2 flex gap-1">
          <ElSelect v-model="clipAction" class="flex-1">
            <ElOption
              v-for="item in actionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
          <ElButton
            :disabled="object.locked"
            class="!ml-0"
            @click="emit('addClip', clipAction)"
          >
            从当前帧添加
          </ElButton>
        </div>
        <div
          v-for="clip in formData.clips"
          :key="clip.id"
          class="mb-1.5 rounded border border-solid p-2"
          :class="clip.id === selectedClip ? 'border-primary' : 'border-border'"
        >
          <div class="flex items-center justify-between">
            <span class="text-[13px]">
              {{ directorActions[clip.action] }} · {{ clip.start }}–{{
                clip.end
              }}
              帧
            </span>
            <ElButton
              link
              type="danger"
              size="small"
              :disabled="object.locked"
              @click="emit('removeClip', clip.id)"
            >
              删除
            </ElButton>
          </div>
          <div class="grid grid-cols-3 gap-1">
            <ElInputNumber
              v-for="field in CLIP_FIELDS"
              :key="field.key"
              v-model="clip[field.key]"
              :min="field.min"
              :max="field.key === 'end' ? end + 1 : field.max"
              :step="field.step"
              :controls="false"
              :disabled="object.locked"
              :placeholder="field.label"
              :title="field.label"
              class="!w-full"
              @change="
                commitInput('patchClip', clip.id, {
                  [field.key]: clip[field.key],
                })
              "
            />
          </div>
          <div
            class="text-muted-foreground mt-0.5 grid grid-cols-3 gap-1 text-[11px]"
          >
            <span v-for="field in CLIP_FIELDS" :key="field.key">
              {{ field.label }}
            </span>
          </div>
        </div>
      </template>
    </ElForm>
    <ElEmpty
      v-else
      description="在视口或时间轴中选择对象、摄影机"
      class="!mt-10"
    />
  </div>
</template>
