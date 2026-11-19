<script lang="ts" setup>
import type {
  ActionClip,
  CameraKey,
  DirectorAction,
  DirectorDocument,
  DirectorJoint,
  DirectorKind,
  DirectorObject,
  DirectorPose,
  ObjectKey,
  Vec3,
} from './director';

import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { until } from '@vueuse/core';
import {
  Button,
  Checkbox,
  Dropdown,
  Empty,
  InputNumber,
  Menu,
  MenuItem,
  message,
  Progress,
  RadioButton,
  RadioGroup,
  Select,
  Spin,
  Tooltip,
} from 'ant-design-vue';

import { createDramaMotionReference } from '#/api/ai/drama/asset';
import { getDramaDirector, saveDramaDirector } from '#/api/ai/drama/canvas';
import { useUpload } from '#/components/upload/use-upload';

import { useDramaAutoSave } from '../canvas/use-auto-save';
import {
  battleDirector,
  cameraAt,
  cloneDirector,
  directorKinds,
  directorMaxDuration,
  emptyDirector,
  mirrorDirectorPose,
  moveDirectorKey,
  newActionClip,
  newDirectorObject,
  objectAt,
  performanceDirector,
  resizeDirector,
  sampleDirector,
  totalFrames,
  upsertKey,
  validateDirector,
} from './director';
import DirectorCaptureDialog from './modules/director-capture-dialog.vue';
import DirectorInspector from './modules/director-inspector.vue';
import DirectorTimeline from './modules/director-timeline.vue';
import DirectorViewport from './modules/director-viewport.vue';

/** AI 短剧：3D 导演。画布预演节点的白模场景、人物动作、机位与时间轴；保存为导演工程，导出白模视频后可加入项目的动作参考 */
defineOptions({ name: 'AiDramaDirector' });

const props = defineProps<{ detail: AiDramaProjectApi.ProjectDetail }>();
const emit = defineEmits<{
  refresh: [];
  saved: [nodeId: string, summary: string];
}>();

const HISTORY_LIMIT = 50;

const dialogVisible = ref(false);
const loading = ref(false);
const loaded = ref(false); // 当前代次的工程是否已加载成功：只有加载成功的工程才能保存
const saving = ref(false);
const nodeId = ref('');
const title = ref('');
const revision = ref(0);
const doc = ref<DirectorDocument>(emptyDirector());
const savedJson = ref('');
const docJson = computed(() => JSON.stringify(doc.value));
const dirty = computed(() => docJson.value !== savedJson.value);
const undoStack = ref<string[]>([]);
const redoStack = ref<string[]>([]);

const selected = ref('');
const selectedClip = ref('');
const joint = ref<DirectorJoint>('rightArm');
const frame = ref(0);
const playing = ref(false);
const tool = ref<'pose' | 'rotate' | 'scale' | 'translate'>('translate');
const guides = ref(true);
const poseClipboard = ref<DirectorPose>();
const captureRef = ref<InstanceType<typeof DirectorCaptureDialog>>();
const fileRef = ref<HTMLInputElement>();

const exporting = ref(false);
const progress = ref(0);
let controller: AbortController | undefined;
const busy = computed(() => exporting.value || loading.value);

const end = computed(() => totalFrames(doc.value) - 1);
const object = computed(() =>
  doc.value.objects.find((item) => item.id === selected.value),
);
/** 场景栏底部：已锁定、已隐藏的对象数 */
const sceneSummary = computed(() => {
  const locked = doc.value.objects.filter((item) => item.locked).length;
  const hidden = doc.value.objects.filter((item) => !item.visible).length;
  return [
    locked ? `${locked} 个已锁定` : '',
    hidden ? `${hidden} 个已隐藏` : '',
  ]
    .filter(Boolean)
    .join(' · ');
});
const aspectOptions = [
  { label: '16:9 横屏', value: '16:9' },
  { label: '9:16 竖屏', value: '9:16' },
];

const [Modal, modalApi] = useVbenModal({
  closeOnClickModal: false,
  footer: false,
  fullscreen: true,
  fullscreenButton: false,
  async onBeforeClose() {
    return await confirmLeave();
  },
  onOpenChange(isOpen) {
    dialogVisible.value = isOpen;
  },
});

// ========== 打开、保存 ==========

/** 等待进行中的保存结束：多个等待者依次醒来时，重新检查，保证同一时间只有一次保存 */
async function waitSaved() {
  while (saving.value) {
    await until(saving).toBe(false);
  }
}

/** 打开代次：每次打开递增；保存的回包只在代次不变（仍是同一次打开的同一节点）时写入修订号与保存基线 */
let generation = 0;

/** 打开预演节点的导演工程；复制来的节点首次打开时，以来源节点的工程为初稿 */
async function open(id: string, nodeTitle: string, sourceNodeId?: string) {
  const current = ++generation;
  autoSave.cancel();
  dialogVisible.value = true;
  modalApi.open();
  nodeId.value = id;
  title.value = nodeTitle;
  loading.value = true;
  loaded.value = false;
  try {
    // 先等上一个工程在途的保存结束，再加载：不被旧的回包覆盖修订号
    await waitSaved();
    const projectId = props.detail.project.id;
    const data = await getDramaDirector(projectId, id);
    let document = data.document;
    if (!document && sourceNodeId) {
      document = (await getDramaDirector(projectId, sourceNodeId)).document;
    }
    if (current !== generation) {
      return;
    }
    revision.value = data.revision;
    doc.value = document ? validateDirector(document) : emptyDirector();
    savedJson.value = data.document ? JSON.stringify(doc.value) : '';
    autoSave.reset();
    undoStack.value = [];
    redoStack.value = [];
    selected.value = '';
    frame.value = 0;
    loaded.value = true;
  } catch {
    // 加载失败（错误提示由请求拦截器展示）：清掉上一个工程的内容并关闭窗口，不以旧工程编辑、保存到该节点
    if (current === generation) {
      doc.value = emptyDirector();
      savedJson.value = JSON.stringify(doc.value);
      autoSave.reset();
      await modalApi.close();
    }
  } finally {
    if (current === generation) {
      loading.value = false;
    }
  }
}

/**
 * 保存工程：修订号不一致时后端拒绝
 *
 * 手动保存、自动保存依次进行：上一次未结束时先等待，避免以同一修订号重复提交；自动保存不弹成功提示；
 * 调用时记录打开代次与节点：等待期间打开了（同一或另一节点的）工程、或正在加载时放弃保存，不把旧工程提交到新节点；
 * 保存期间关闭后又打开了工程时，回包不再写入当前工程的修订号与保存基线
 */
async function persist(silent = false) {
  const current = generation;
  const id = nodeId.value;
  // 检查与占用在同一同步段内完成：多个等待者醒来时，只有第一个能占用，其余继续等待
  while (saving.value) {
    await until(saving).toBe(false);
  }
  if (
    current !== generation ||
    id !== nodeId.value ||
    loading.value ||
    !loaded.value
  ) {
    return false;
  }
  saving.value = true;
  try {
    // 以本次提交的文档为保存基线：保存期间的后续修改仍为未保存，回包只更新修订号
    const json = JSON.stringify(doc.value);
    const snapshot: DirectorDocument = JSON.parse(json);
    const nextRevision = await saveDramaDirector({
      projectId: props.detail.project.id,
      nodeId: id,
      revision: revision.value,
      document: snapshot,
    });
    if (current === generation) {
      revision.value = nextRevision;
      savedJson.value = json;
    }
    if (!silent) {
      message.success('导演工程已保存');
    }
    // 摘要写入保存的那个预演节点
    emit(
      'saved',
      id,
      `${snapshot.objects.length} 个场景对象 · ${snapshot.camera.keys.length} 个机位关键帧 · ${snapshot.duration} 秒 ${snapshot.aspect}`,
    );
    return true;
  } catch {
    return false;
  } finally {
    saving.value = false;
  }
}

async function handleSave() {
  if (await persist()) {
    autoSave.resume();
  }
}

/** 自动保存：默认关闭，勾选后编辑停顿时保存；失败后暂停，手动保存成功后恢复 */
const autoSave = useDramaAutoSave({
  storageKey: 'ai-drama-director-auto-save',
  snapshot: () => docJson.value,
  dirty,
  saving,
  ready: () => dialogVisible.value && !busy.value && !saving.value,
  save: () => persist(true),
});

const saveStatus = computed(() => {
  if (saving.value) {
    return '保存中…';
  }
  if (autoSave.paused.value && dirty.value) {
    return '自动保存失败，已暂停，请检查后手动保存';
  }
  if (dirty.value) {
    return '有未保存的修改';
  }
  return revision.value ? `已保存 · 修订 ${revision.value}` : '尚未保存';
});

/**
 * 关闭工程前（关闭对话框、离开画布）：开启自动保存时立即保存，保存成功后直接关闭；
 * 手动保存模式、自动保存失败时仍有未保存的修改，确认后关闭
 *
 * @return 是否可以关闭
 */
async function confirmLeave() {
  if (!dialogVisible.value) {
    return true;
  }
  if (exporting.value) {
    message.warning('视频正在导出，请先取消导出');
    return false;
  }
  stop();
  if (dirty.value && !loading.value && autoSave.enabled.value) {
    await autoSave.flush();
  }
  if (!dirty.value) {
    return true;
  }
  try {
    await confirm('导演工程有未保存的修改，确认关闭？');
    return true;
  } catch {
    return false;
  }
}

/** 是否有未保存的修改：只算打开中的工程（关闭时已确认放弃的不算） */
const unsaved = computed(() => dialogVisible.value && dirty.value);
defineExpose({ open, confirmLeave, dirty: unsaved });

// ========== 编辑：每次修改先校验，再记入撤销 ==========

function replace(next: DirectorDocument) {
  undoStack.value = [...undoStack.value, JSON.stringify(doc.value)].slice(
    -HISTORY_LIMIT,
  );
  redoStack.value = [];
  doc.value = next;
}

function mutate(action: (next: DirectorDocument) => void) {
  if (busy.value) {
    return false;
  }
  stop();
  try {
    const next = cloneDirector(doc.value);
    action(next);
    replace(validateDirector(next));
    return true;
  } catch (error) {
    message.warning(error instanceof Error ? error.message : '编辑未完成');
    return false;
  }
}

function handleHistory(type: 'redo' | 'undo') {
  stop();
  const from = type === 'undo' ? undoStack : redoStack;
  const to = type === 'undo' ? redoStack : undoStack;
  const previous = from.value[from.value.length - 1];
  if (!previous) {
    return;
  }
  from.value = from.value.slice(0, -1);
  to.value = [...to.value, JSON.stringify(doc.value)];
  doc.value = JSON.parse(previous);
  frame.value = Math.min(frame.value, end.value);
  if (selected.value !== 'camera' && !object.value) {
    selected.value = '';
  }
}

/** 修改选中的对象：锁定的对象不能修改 */
function mutateObject(action: (item: DirectorObject) => void) {
  return mutate((next) => {
    const item = next.objects.find((value) => value.id === selected.value);
    if (item && !item.locked) {
      action(item);
    }
  });
}

function patchObject(id: string, patch: Partial<DirectorObject>) {
  return mutate((next) => {
    const item = next.objects.find((value) => value.id === id);
    // 锁定时只能改名称、颜色、显示、锁定
    if (
      item &&
      !(
        item.locked &&
        Object.keys(patch).some(
          (key) => !['color', 'locked', 'name', 'visible'].includes(key),
        )
      )
    ) {
      Object.assign(item, patch);
      if ('lookAtId' in patch && !patch.lookAtId) {
        delete item.lookAtId;
      }
    }
  });
}

function patchKey(patch: Partial<ObjectKey>) {
  return mutateObject((item) => {
    item.keys = upsertKey(item.keys, {
      ...objectAt(item, frame.value),
      ...patch,
      frame: frame.value,
    });
  });
}

function patchCamera(patch: Partial<CameraKey>) {
  return mutate((next) => {
    next.camera.keys = upsertKey(next.camera.keys, {
      ...cameraAt(next, frame.value),
      ...patch,
      frame: frame.value,
    });
  });
}

function handleAdd(kind: DirectorKind) {
  let id = '';
  if (
    mutate((next) => {
      const item = newDirectorObject(
        kind,
        next.objects.filter((value) => value.kind === kind).length,
      );
      next.objects.push(item);
      id = item.id;
    })
  ) {
    selected.value = id;
    frame.value = 0;
  }
}

function handleSelect(id: string) {
  stop();
  if (
    tool.value === 'pose' &&
    doc.value.objects.find((item) => item.id === id)?.kind !== 'actor'
  ) {
    tool.value = 'translate';
  }
  selected.value = id;
  selectedClip.value = '';
}

function handleDeleteKey() {
  if (!frame.value) {
    return;
  }
  if (selected.value === 'camera') {
    mutate((next) => {
      next.camera.keys = next.camera.keys.filter(
        (key) => key.frame !== frame.value,
      );
    });
  } else {
    mutateObject((item) => {
      item.keys = item.keys.filter((key) => key.frame !== frame.value);
    });
  }
}

/** 删除对象：一并清除其它对象对它的注视、命中目标，以及相机跟随 */
function handleRemove() {
  const id = selected.value;
  if (
    mutate((next) => {
      next.objects = next.objects.filter((item) => item.id !== id);
      for (const item of next.objects) {
        if (item.lookAtId === id) delete item.lookAtId;
        if (item.targetId === id) delete item.targetId;
      }
      if (next.camera.follow?.objectId === id) delete next.camera.follow;
    })
  ) {
    selected.value = '';
  }
}

function handleDuplicate() {
  let id = '';
  if (
    mutate((next) => {
      const item = next.objects.find((value) => value.id === selected.value);
      if (!item) return;
      const clone = cloneDirector(item);
      clone.id = crypto.randomUUID();
      clone.name = `${item.name.slice(0, 90)} · 副本`;
      clone.locked = false;
      for (const key of clone.keys) key.position[0] += 1;
      next.objects.push(clone);
      id = clone.id;
    }) &&
    id
  ) {
    selected.value = id;
  }
}

/** 视口中拖动：对象写入当前帧的位置、朝向和缩放；“view”为当前视角设为机位 */
function handleTransform(id: string, position: Vec3, yaw: number, scale: Vec3) {
  if (id === 'view') {
    selected.value = 'camera';
    patchCamera({ position, target: scale });
    return;
  }
  selected.value = id;
  if (id === 'camera') {
    patchCamera({ position });
    return;
  }
  mutateObject((item) => {
    item.keys = upsertKey(item.keys, {
      ...objectAt(item, frame.value),
      frame: frame.value,
      position: position.map((value) =>
        Math.max(-100, Math.min(100, value)),
      ) as Vec3,
      yaw,
    });
    item.scale = scale.map((value) =>
      Math.max(0.1, Math.min(20, value)),
    ) as Vec3;
  });
}

function handleJointRotation(name: DirectorJoint, rotation: Vec3) {
  if (object.value) {
    patchKey({
      pose: { ...objectAt(object.value, frame.value).pose, [name]: rotation },
    });
  }
}

function handleMoveKey(id: string, from: number, to: number, copy: boolean) {
  selected.value = id;
  if (
    mutate((next) => {
      if (id === 'camera') {
        next.camera.keys = moveDirectorKey(
          next.camera.keys,
          from,
          to,
          end.value,
          copy,
        );
        return;
      }
      const item = next.objects.find((value) => value.id === id);
      if (item && !item.locked) {
        item.keys = moveDirectorKey(item.keys, from, to, end.value, copy);
      }
    })
  ) {
    seek(to);
  }
}

// ========== 动作片段、相机跟随 ==========

function handleAddClip(action: DirectorAction) {
  let id = '';
  mutateObject((item) => {
    const clip = newActionClip(item, frame.value, end.value, action);
    item.clips = [...(item.clips || []), clip].sort(
      (a, b) => a.start - b.start,
    );
    id = clip.id;
  });
  selectedClip.value = id;
}

function handlePatchClip(id: string, patch: Partial<ActionClip>) {
  return mutateObject((item) => {
    item.clips = item.clips
      ?.map((clip) => (clip.id === id ? { ...clip, ...patch, id } : clip))
      .sort((a, b) => a.start - b.start);
  });
}

function handleRemoveClip(id: string) {
  return mutateObject((item) => {
    item.clips = item.clips?.filter((clip) => clip.id !== id);
  });
}

function handleSelectClip(objectId: string, id: string) {
  selected.value = objectId;
  selectedClip.value = id;
  const clip = object.value?.clips?.find((item) => item.id === id);
  if (clip) {
    seek(clip.start);
  }
}

/** 相机跟随：取消时把当前画面记为关键帧，避免机位跳变 */
function handleFollow(id: string) {
  return mutate((next) => {
    if (!id) {
      const current = cameraAt(next, frame.value);
      delete next.camera.follow;
      next.camera.keys = upsertKey(next.camera.keys, current);
      return;
    }
    const item = next.objects.find((value) => value.id === id);
    if (!item) return;
    const position = objectAt(item, frame.value).position;
    const camera = cameraAt(next, frame.value);
    next.camera.follow = {
      objectId: id,
      mode: 'aim',
      height: item.kind === 'actor' ? 1.3 : 0.5,
      offset: camera.position.map((value, i) => value - position[i]!) as Vec3,
    };
  });
}

function handlePatchFollow(patch: Record<string, any>) {
  return mutate((next) => {
    if (next.camera.follow) {
      Object.assign(next.camera.follow, patch);
    }
  });
}

// ========== 时长、示例、工程文件 ==========

/** 时长输入：双向绑定，失焦或回车时调整工程；无效值回到工程的时长 */
const durationInput = ref<number | undefined>(8);
watch(
  () => doc.value.duration,
  (value) => (durationInput.value = value),
  { immediate: true },
);
function handleDuration() {
  const value = durationInput.value;
  if (
    !value ||
    !Number.isInteger(value) ||
    value === doc.value.duration ||
    busy.value
  ) {
    durationInput.value = doc.value.duration;
    return;
  }
  stop();
  replace(resizeDirector(doc.value, value));
  frame.value = Math.min(frame.value, end.value);
}
function blurOnEnter(event: KeyboardEvent) {
  (event.target as HTMLInputElement).blur();
}

function filename() {
  return title.value.replaceAll(/[\\/:*?"<>|]/g, '-').slice(0, 80);
}

/** 下载到本地：工程文件、当前帧、白模视频 */
function saveBlob(blob: Blob, name: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = name;
  link.click();
  URL.revokeObjectURL(href);
}

function downloadDocument() {
  saveBlob(
    new Blob([JSON.stringify(doc.value, null, 2)], {
      type: 'application/json',
    }),
    `${filename()}-导演工程.json`,
  );
}

/** 替换整个工程（示例、导入、动作提取）：有未保存的修改时先下载备份 */
function handleReplace(next: DirectorDocument) {
  if (dirty.value) {
    downloadDocument();
  }
  stop();
  replace(next);
  frame.value = 0;
  selected.value = next.objects[0]?.id || '';
}

function handlePreset(command: string) {
  if (command === 'export') {
    downloadDocument();
  } else if (command === 'import') {
    fileRef.value?.click();
  } else if (command === 'clear') {
    handleReplace(emptyDirector());
  } else {
    handleReplace(
      command === 'performance'
        ? performanceDirector()
        : command === 'battle'
          ? battleDirector()
          : sampleDirector(),
    );
  }
}

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  try {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      message.warning('工程文件不能超过 1MB');
      return;
    }
    handleReplace(validateDirector(JSON.parse(await file.text())));
  } catch (error) {
    message.warning(error instanceof Error ? error.message : '导入失败');
  } finally {
    input.value = '';
  }
}

// ========== 播放 ==========

let playback = 0;
function stop() {
  playing.value = false;
  cancelAnimationFrame(playback);
}
function seek(value: number) {
  stop();
  frame.value = Math.max(
    0,
    Math.min(end.value, Math.round(Number.isFinite(value) ? value : 0)),
  );
}
function handlePlay() {
  if (busy.value) return;
  if (playing.value) {
    stop();
    return;
  }
  if (frame.value >= end.value) {
    frame.value = 0;
  }
  playing.value = true;
  const startFrame = frame.value;
  const startTime = performance.now();
  const tick = (now: number) => {
    frame.value = Math.min(
      end.value,
      startFrame + Math.floor(((now - startTime) / 1000) * doc.value.fps),
    );
    if (frame.value >= end.value) {
      stop();
      return;
    }
    playback = requestAnimationFrame(tick);
  };
  playback = requestAnimationFrame(tick);
}

// ========== 导出：白模视频、当前帧；视频可加入动作参考 ==========

const [VideoModal, videoApi] = useVbenModal({});
const videoUrl = ref('');
const videoBlob = ref<Blob>();
const referenceSaving = ref(false);
const referenceSaved = ref(false);

async function handleExportVideo() {
  stop();
  exporting.value = true;
  progress.value = 0;
  controller = new AbortController();
  try {
    const { exportDirectorVideo } = await import('./director-export');
    videoBlob.value = await exportDirectorVideo(
      doc.value,
      (value) => (progress.value = value),
      controller.signal,
    );
    if (videoUrl.value) {
      URL.revokeObjectURL(videoUrl.value);
    }
    videoUrl.value = URL.createObjectURL(videoBlob.value);
    referenceSaved.value = false;
    videoApi.open();
  } catch (error) {
    message.error(
      error instanceof Error
        ? error.message
        : '导出失败，请确认浏览器支持 H.264 WebCodecs',
    );
  } finally {
    exporting.value = false;
    controller = undefined;
  }
}

async function handleExportFrame() {
  stop();
  exporting.value = true;
  try {
    const { exportDirectorFrame } = await import('./director-export');
    saveBlob(
      await exportDirectorFrame(doc.value, frame.value),
      `${filename()}-第${frame.value}帧.png`,
    );
  } catch (error) {
    message.error(error instanceof Error ? error.message : '导出失败');
  } finally {
    exporting.value = false;
  }
}

function handleDownloadVideo() {
  saveBlob(videoBlob.value!, `${filename()}-白模预演.mp4`);
}

const { httpRequest } = useUpload('ai/drama');

/** 上传白模视频，加入项目的动作参考 */
async function handleSaveReference() {
  referenceSaving.value = true;
  try {
    const file = new File([videoBlob.value!], `${filename()}-白模预演.mp4`, {
      type: 'video/mp4',
    });
    const res = await httpRequest(file);
    const fileUrl: string = typeof res === 'string' ? res : res?.url;
    await createDramaMotionReference({
      projectId: props.detail.project.id,
      name: `${title.value.slice(0, 40)} · 白模预演`,
      fileUrl,
    });
    referenceSaved.value = true;
    message.success('已加入动作参考，可在分镜编辑中选用');
    emit('refresh');
  } finally {
    referenceSaving.value = false;
  }
}

watch(dialogVisible, (value) => {
  if (!value) {
    stop();
    controller?.abort();
    // 关闭时放弃排队中的自动保存：未保存的修改已由用户确认放弃
    autoSave.cancel();
  }
});
onBeforeUnmount(() => {
  stop();
  controller?.abort();
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value);
  }
});
</script>

<template>
  <Modal :title="`3D 导演 · ${title}`">
    <Spin :spinning="loading">
      <div class="flex h-[calc(100vh-100px)] flex-col">
        <!-- 工具栏：编辑在左，保存在右；添加对象在左侧场景栏 -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2">
          <div class="flex flex-wrap items-center gap-2">
            <RadioGroup v-model:value="tool" option-type="button">
              <RadioButton value="translate">移动</RadioButton>
              <RadioButton value="rotate">旋转</RadioButton>
              <RadioButton value="scale">缩放</RadioButton>
              <RadioButton value="pose" :disabled="object?.kind !== 'actor'">
                姿态
              </RadioButton>
            </RadioGroup>
            <Checkbox v-model:checked="guides">辅助线</Checkbox>
            <Button.Group>
              <Button
                :disabled="!undoStack.length || busy"
                @click="handleHistory('undo')"
              >
                <IconifyIcon icon="lucide:undo-2" />
              </Button>
              <Button
                :disabled="!redoStack.length || busy"
                @click="handleHistory('redo')"
              >
                <IconifyIcon icon="lucide:redo-2" />
              </Button>
            </Button.Group>
            <span class="text-[13px]">时长</span>
            <InputNumber
              v-model:value="durationInput"
              :min="2"
              :max="directorMaxDuration"
              :precision="0"
              :disabled="busy"
              class="!w-[100px]"
              @blur="handleDuration"
              @press-enter="blurOnEnter"
            />
            <Select
              :value="doc.aspect"
              :options="aspectOptions"
              :disabled="busy"
              class="!w-[110px]"
              @change="
                (value) =>
                  mutate((next) => (next.aspect = value as '16:9' | '9:16'))
              "
            />
            <Dropdown :disabled="busy" :trigger="['click']">
              <Button :disabled="busy">
                导入 / 导出
                <IconifyIcon icon="lucide:chevron-down" class="ml-1 inline" />
              </Button>
              <template #overlay>
                <Menu @click="({ key }) => handlePreset(String(key))">
                  <MenuItem key="export">下载工程文件</MenuItem>
                  <MenuItem key="import">导入工程文件</MenuItem>
                </Menu>
              </template>
            </Dropdown>
            <Button :disabled="busy" @click="captureRef?.open()">
              参考视频动作
            </Button>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="text-xs"
              :class="
                autoSave.paused.value
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              "
            >
              {{ saveStatus }}
            </span>
            <Checkbox v-model:checked="autoSave.enabled.value">
              自动保存
            </Checkbox>
            <Button
              type="primary"
              :loading="saving"
              :disabled="!dirty || busy"
              @click="handleSave"
            >
              保存工程
            </Button>
          </div>
        </div>

        <div
          class="border-border flex min-h-0 flex-1 overflow-hidden border border-solid"
        >
          <!-- 场景栏：直接添加对象；列表中选择，就地显示、隐藏、锁定、解锁；底部载入示例、清空场景 -->
          <div
            class="border-border bg-card flex w-[220px] shrink-0 flex-col border-r border-solid"
          >
            <div class="flex items-center justify-between px-3 pt-2.5 pb-1">
              <span class="text-[13px] font-semibold">场景</span>
              <span class="text-muted-foreground text-xs">
                {{ doc.objects.length }} 个对象
              </span>
            </div>
            <div class="grid grid-cols-2 gap-1 px-2 pb-2">
              <Button
                v-for="(label, kind) in directorKinds"
                :key="kind"
                size="small"
                :disabled="busy"
                @click="handleAdd(kind as DirectorKind)"
              >
                + {{ label }}
              </Button>
            </div>
            <div
              class="border-border min-h-0 flex-1 overflow-y-auto border-t border-solid"
            >
              <div
                class="hover:bg-accent flex cursor-pointer items-center px-3 py-2 text-[13px]"
                :class="{ 'text-primary bg-primary/10': selected === 'camera' }"
                @click="handleSelect('camera')"
              >
                <IconifyIcon icon="lucide:camera" class="mr-1.5" />
                <span class="flex-1">摄影机</span>
                <span class="text-muted-foreground text-xs">
                  {{ doc.camera.keys.length }} 帧
                </span>
              </div>
              <div
                v-for="item in doc.objects"
                :key="item.id"
                class="hover:bg-accent flex cursor-pointer items-center px-3 py-2 text-[13px]"
                :class="{
                  'text-primary bg-primary/10': selected === item.id,
                  'opacity-50': !item.visible,
                }"
                @click="handleSelect(item.id)"
              >
                <span
                  class="mr-1.5 inline-block size-2.5 shrink-0 rounded-sm"
                  :style="{ background: item.color }"
                ></span>
                <span class="flex-1 truncate">{{ item.name }}</span>
                <Tooltip :title="item.visible ? '隐藏' : '显示'">
                  <Button
                    type="link"
                    size="small"
                    :disabled="busy"
                    @click.stop="
                      patchObject(item.id, { visible: !item.visible })
                    "
                  >
                    <IconifyIcon
                      :icon="item.visible ? 'lucide:eye' : 'lucide:eye-off'"
                    />
                  </Button>
                </Tooltip>
                <Tooltip
                  :title="item.locked ? '解锁' : '锁定：仍可查看，解锁后再调整'"
                >
                  <Button
                    type="link"
                    size="small"
                    :class="{ '!text-warning': item.locked }"
                    :disabled="busy"
                    @click.stop="patchObject(item.id, { locked: !item.locked })"
                  >
                    <IconifyIcon
                      :icon="item.locked ? 'lucide:lock' : 'lucide:lock-open'"
                    />
                  </Button>
                </Tooltip>
              </div>
              <Empty
                v-if="!doc.objects.length"
                description="添加人物白模、道具后，沿时间轴设置动作与机位"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />
            </div>
            <div class="border-border border-t border-solid p-2">
              <div
                v-if="sceneSummary"
                class="text-muted-foreground mb-1.5 text-xs"
              >
                {{ sceneSummary }}
              </div>
              <div class="flex gap-1">
                <Dropdown :disabled="busy" :trigger="['click']">
                  <Button size="small" class="flex-1" :disabled="busy">
                    载入示例
                    <IconifyIcon
                      icon="lucide:chevron-down"
                      class="ml-1 inline"
                    />
                  </Button>
                  <template #overlay>
                    <Menu @click="({ key }) => handlePreset(String(key))">
                      <MenuItem key="sample">走位示例</MenuItem>
                      <MenuItem key="performance">表演示例</MenuItem>
                      <MenuItem key="battle">攻城示例</MenuItem>
                    </Menu>
                  </template>
                </Dropdown>
                <Button
                  size="small"
                  :disabled="busy || !doc.objects.length"
                  @click="handlePreset('clear')"
                >
                  清空场景
                </Button>
              </div>
            </div>
          </div>
          <DirectorViewport
            v-if="dialogVisible && !loading"
            class="flex-1"
            :document="doc"
            :frame="frame"
            :selected="selected"
            :joint="joint"
            :tool="tool"
            :playing="playing"
            :guides="guides"
            @select="handleSelect"
            @joint="(value) => (joint = value)"
            @joint-rotation="handleJointRotation"
            @seek="seek"
            @transform="handleTransform"
          />
          <DirectorInspector
            :document="doc"
            :selected="selected"
            :frame="frame"
            :joint="joint"
            :selected-clip="selectedClip"
            :can-paste="!!poseClipboard"
            @patch-object="(patch) => patchObject(selected, patch)"
            @patch-key="patchKey"
            @patch-camera="patchCamera"
            @delete-key="handleDeleteKey"
            @remove="handleRemove"
            @duplicate="handleDuplicate"
            @joint="(value) => (joint = value)"
            @joint-rotation="handleJointRotation"
            @copy-pose="
              poseClipboard = cloneDirector(objectAt(object!, frame).pose || {})
            "
            @paste-pose="patchKey({ pose: cloneDirector(poseClipboard!) })"
            @mirror-pose="
              patchKey({
                pose: mirrorDirectorPose(objectAt(object!, frame).pose || {}),
              })
            "
            @add-clip="handleAddClip"
            @patch-clip="handlePatchClip"
            @remove-clip="handleRemoveClip"
            @follow="handleFollow"
            @patch-follow="handlePatchFollow"
          />
        </div>

        <div
          class="border-border mb-2 h-[200px] border border-t-0 border-solid"
        >
          <DirectorTimeline
            :document="doc"
            :frame="frame"
            :selected="selected"
            :selected-clip="selectedClip"
            :playing="playing"
            @seek="seek"
            @play="handlePlay"
            @select="handleSelect"
            @add-key="selected === 'camera' ? patchCamera({}) : patchKey({})"
            @clip="handleSelectClip"
            @move-key="handleMoveKey"
          />
        </div>

        <!-- 导出：独立的底部区域 -->
        <div
          class="border-border flex items-center justify-between gap-3 border-t border-solid pt-2.5"
        >
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <Progress
              v-if="exporting"
              :percent="Math.round(progress * 100)"
              class="!w-[300px]"
            />
            <Button v-if="exporting" type="link" @click="controller?.abort()">
              取消导出
            </Button>
            <span v-else class="text-muted-foreground text-xs">
              按摄影机监看的构图逐帧导出 24 fps H.264
              视频，辅助线不进入画面；导出依赖浏览器 WebCodecs
            </span>
          </div>
          <Button :disabled="busy" @click="handleExportFrame">
            导出当前帧
          </Button>
          <Button type="primary" :disabled="busy" @click="handleExportVideo">
            导出白模视频
          </Button>
        </div>
      </div>
    </Spin>
  </Modal>

  <!-- 导出的白模视频：下载、加入动作参考 -->
  <VideoModal title="白模视频" class="w-[640px]">
    <video
      v-if="videoUrl"
      :src="videoUrl"
      controls
      class="max-h-[420px] w-full bg-black"
    ></video>
    <div class="text-muted-foreground mt-2 text-xs">
      加入动作参考后，可在分镜编辑的“动作参考视频”中选用；动作参考限 2~30 秒
    </div>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <Button @click="handleDownloadVideo">下载</Button>
        <Button
          type="primary"
          :loading="referenceSaving"
          :disabled="doc.duration > 30 || referenceSaved"
          @click="handleSaveReference"
        >
          {{ referenceSaved ? '已加入动作参考' : '加入动作参考' }}
        </Button>
      </div>
    </template>
  </VideoModal>

  <DirectorCaptureDialog
    ref="captureRef"
    :detail="detail"
    @import="handleReplace"
  />
  <input
    ref="fileRef"
    type="file"
    accept="application/json,.json"
    class="hidden"
    @change="handleImportFile"
  />
</template>
