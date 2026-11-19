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
  Alert,
  Button,
  Checkbox,
  Divider,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  RadioButton,
  RadioGroup,
  Select,
  Slider,
  Switch,
} from 'antdv-next';

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
 * 编辑中的属性：输入框双向绑定这里，失焦或回车时提交到导演工程；
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

/** 输入框失焦或回车：内容有修改时才提交 */
function commitInput(event: string, ...args: any[]) {
  if (JSON.stringify(formData) !== baseline) {
    commit(event, ...args);
  }
}

/** 回车时失焦，由失焦提交，避免回车和失焦重复提交 */
function blurOnEnter(event: KeyboardEvent) {
  (event.target as HTMLInputElement).blur();
}

function handleColorChange(event: Event) {
  formData.color = (event.target as HTMLInputElement).value;
  commit('patchObject', { color: formData.color || object.value?.color });
}
</script>

<template>
  <div
    class="border-border bg-card h-full w-[320px] shrink-0 overflow-y-auto border-l border-solid"
  >
    <!-- 摄影机 -->
    <Form
      v-if="selected === 'camera'"
      :model="formData"
      layout="vertical"
      size="small"
      class="p-3"
    >
      <div class="mb-2 text-sm font-semibold">摄影机 · 第 {{ frame }} 帧</div>
      <FormItem
        v-for="field in CAMERA_VECTORS"
        :key="field.key"
        :label="field.label"
        class="!mb-3"
      >
        <div class="flex gap-1">
          <InputNumber
            v-for="i in AXES"
            :key="i"
            v-model:value="formData.camera[field.key][i]"
            :step="0.1"
            :min="-100"
            :max="100"
            :controls="false"
            class="!w-1/3"
            @blur="
              commitInput('patchCamera', {
                [field.key]: [...formData.camera[field.key]],
              })
            "
            @press-enter="blurOnEnter"
          />
        </div>
      </FormItem>
      <FormItem label="视角（度）" class="!mb-3">
        <Slider
          v-model:value="formData.camera.fov"
          :min="15"
          :max="100"
          @after-change="commit('patchCamera', { fov: formData.camera.fov })"
        />
      </FormItem>
      <FormItem label="横滚（度）" class="!mb-3">
        <Slider
          v-model:value="formData.camera.roll"
          :min="-180"
          :max="180"
          @after-change="commit('patchCamera', { roll: formData.camera.roll })"
        />
      </FormItem>
      <FormItem label="到下一关键帧的插值" class="!mb-3">
        <Select
          v-model:value="formData.camera.ease"
          :options="easeOptions"
          @change="commit('patchCamera', { ease: formData.camera.ease })"
        />
      </FormItem>
      <FormItem label="跟随对象" class="!mb-3">
        <Select
          v-model:value="formData.follow.objectId"
          :options="followOptions"
          @change="commit('follow', formData.follow.objectId)"
        />
      </FormItem>
      <template v-if="document.camera.follow">
        <FormItem label="跟随方式" class="!mb-3">
          <RadioGroup
            v-model:value="formData.follow.mode"
            option-type="button"
            @change="commit('patchFollow', { mode: formData.follow.mode })"
          >
            <RadioButton value="aim">只瞄准</RadioButton>
            <RadioButton value="follow">跟拍</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label="瞄准高度（米）" class="!mb-3">
          <InputNumber
            v-model:value="formData.follow.height"
            :min="0"
            :max="3"
            :step="0.1"
            @blur="
              commitInput('patchFollow', { height: formData.follow.height })
            "
            @press-enter="blurOnEnter"
          />
        </FormItem>
      </template>
      <Button :disabled="!frame" @click="emit('deleteKey')">
        删除本帧关键帧
      </Button>
    </Form>

    <!-- 场景对象 -->
    <Form
      v-else-if="object"
      :model="formData"
      layout="vertical"
      size="small"
      class="p-3"
    >
      <div class="mb-2 flex items-center justify-between">
        <span class="text-sm font-semibold">{{
          directorKinds[object.kind]
        }}</span>
        <div>
          <Button type="link" size="small" @click="emit('duplicate')">
            复制
          </Button>
          <Button
            type="link"
            danger
            size="small"
            :disabled="object.locked"
            @click="emit('remove')"
          >
            删除
          </Button>
        </div>
      </div>
      <!-- 锁定：仍可查看全部属性，解锁后再调整 -->
      <Alert
        v-if="object.locked"
        type="warning"
        show-icon
        title="已锁定：可查看属性，解锁后再调整"
        class="mb-2"
      />
      <FormItem label="名称" class="!mb-3">
        <Input
          v-model:value="formData.name"
          :maxlength="100"
          :disabled="object.locked"
          @blur="
            commitInput('patchObject', {
              name: formData.name.trim() || object.name,
            })
          "
          @press-enter="blurOnEnter"
        />
      </FormItem>
      <FormItem label="颜色 / 显示 / 锁定" class="!mb-3">
        <div class="flex items-center gap-3">
          <input
            :value="formData.color"
            :disabled="object.locked"
            type="color"
            class="border-border bg-background h-6 w-10 cursor-pointer rounded border border-solid p-0.5 disabled:cursor-not-allowed"
            @change="handleColorChange"
          />
          <span class="flex items-center gap-1">
            <Switch
              v-model:checked="formData.visible"
              size="small"
              @change="commit('patchObject', { visible: formData.visible })"
            />
            显示
          </span>
          <span class="flex items-center gap-1">
            <Switch
              v-model:checked="formData.locked"
              size="small"
              @change="commit('patchObject', { locked: formData.locked })"
            />
            锁定
          </span>
        </div>
      </FormItem>
      <FormItem label="缩放" class="!mb-3">
        <div class="flex gap-1">
          <InputNumber
            v-for="i in AXES"
            :key="i"
            v-model:value="formData.scale[i]"
            :step="0.1"
            :min="0.1"
            :max="20"
            :controls="false"
            :disabled="object.locked"
            class="!w-1/3"
            @blur="commitInput('patchObject', { scale: [...formData.scale] })"
            @press-enter="blurOnEnter"
          />
        </div>
      </FormItem>
      <Divider title-placement="start" class="!my-3">第 {{ frame }} 帧</Divider>
      <FormItem label="位置（米）" class="!mb-3">
        <div class="flex gap-1">
          <InputNumber
            v-for="i in AXES"
            :key="i"
            v-model:value="formData.position[i]"
            :step="0.1"
            :min="-100"
            :max="100"
            :controls="false"
            :disabled="object.locked"
            class="!w-1/3"
            @blur="
              commitInput('patchKey', { position: [...formData.position] })
            "
            @press-enter="blurOnEnter"
          />
        </div>
      </FormItem>
      <FormItem label="朝向（度）" class="!mb-3">
        <Slider
          v-model:value="formData.yaw"
          :min="-180"
          :max="180"
          :disabled="object.locked"
          @after-change="commit('patchKey', { yaw: formData.yaw })"
        />
      </FormItem>
      <div class="flex gap-2">
        <FormItem
          v-if="object.kind === 'actor'"
          label="基础动作"
          class="!mb-3 flex-1"
        >
          <Select
            v-model:value="formData.action"
            :options="actionOptions"
            :disabled="object.locked"
            @change="commit('patchKey', { action: formData.action })"
          />
        </FormItem>
        <FormItem label="插值" class="!mb-3 flex-1">
          <Select
            v-model:value="formData.ease"
            :options="easeOptions"
            :disabled="object.locked"
            @change="commit('patchKey', { ease: formData.ease })"
          />
        </FormItem>
      </div>
      <Button
        :disabled="!frame || object.locked"
        class="mb-3"
        @click="emit('deleteKey')"
      >
        删除本帧关键帧
      </Button>

      <!-- 人物：朝向、注视、姿态、动作片段 -->
      <template v-if="object.kind === 'actor'">
        <FormItem label="朝向与注视" class="!mb-3">
          <div class="w-full">
            <Checkbox
              v-model:checked="formData.autoFace"
              :disabled="object.locked"
              @change="commit('patchObject', { autoFace: formData.autoFace })"
            >
              沿移动方向自动转身
            </Checkbox>
            <Select
              v-model:value="formData.lookAtId"
              :options="lookAtOptions"
              placeholder="注视对象"
              :disabled="object.locked"
              class="mt-1 !w-full"
              @change="
                commit('patchObject', {
                  lookAtId: formData.lookAtId || undefined,
                })
              "
            />
          </div>
        </FormItem>
        <Divider title-placement="start" class="!my-3">关节姿态</Divider>
        <FormItem label="关节" class="!mb-3">
          <Select
            :value="joint"
            :options="jointOptions"
            @change="(value) => emit('joint', value)"
          />
        </FormItem>
        <FormItem label="角度 X / Y / Z（度）" class="!mb-3">
          <div class="flex gap-1">
            <InputNumber
              v-for="i in AXES"
              :key="i"
              v-model:value="formData.jointRotation[i]"
              :min="-180"
              :max="180"
              :controls="false"
              :disabled="object.locked"
              class="!w-1/3"
              @blur="
                commitInput('jointRotation', joint, [...formData.jointRotation])
              "
              @press-enter="blurOnEnter"
            />
          </div>
        </FormItem>
        <div class="mb-3 flex flex-wrap gap-1">
          <Button @click="emit('copyPose')">复制姿态</Button>
          <Button
            :disabled="!canPaste || object.locked"
            @click="emit('pastePose')"
          >
            粘贴姿态
          </Button>
          <Button :disabled="object.locked" @click="emit('mirrorPose')">
            左右镜像
          </Button>
        </div>
        <Divider title-placement="start" class="!my-3">动作片段</Divider>
        <div class="mb-2 flex gap-1">
          <Select
            v-model:value="clipAction"
            :options="actionOptions"
            class="flex-1"
          />
          <Button
            :disabled="object.locked"
            @click="emit('addClip', clipAction)"
          >
            从当前帧添加
          </Button>
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
            <Button
              type="link"
              danger
              size="small"
              :disabled="object.locked"
              @click="emit('removeClip', clip.id)"
            >
              删除
            </Button>
          </div>
          <div class="grid grid-cols-3 gap-1">
            <InputNumber
              v-for="field in CLIP_FIELDS"
              :key="field.key"
              v-model:value="clip[field.key]"
              :min="field.min"
              :max="field.key === 'end' ? end + 1 : field.max"
              :step="field.step"
              :controls="false"
              :disabled="object.locked"
              :placeholder="field.label"
              :title="field.label"
              class="!w-full"
              @blur="
                commitInput('patchClip', clip.id, {
                  [field.key]: clip[field.key],
                })
              "
              @press-enter="blurOnEnter"
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
    </Form>
    <Empty
      v-else
      description="在视口或时间轴中选择对象、摄影机"
      class="!mt-10"
    />
  </div>
</template>
