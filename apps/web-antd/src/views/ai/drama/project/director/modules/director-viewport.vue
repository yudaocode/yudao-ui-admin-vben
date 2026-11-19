<script lang="ts" setup>
import type { DirectorDocument, DirectorJoint, Vec3 } from '../director';
import type { DirectorWorld } from '../director-scene';

import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { Alert, Button } from 'ant-design-vue';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

import { objectAt } from '../director';
import {
  applyDirectorFrame,
  createDirectorWorld,
  directorRenderer,
  disposeDirectorWorld,
} from '../director-scene';

/** AI 短剧 3D 导演：三维编辑视口与摄影机监看 */
defineOptions({ name: 'AiDramaDirectorViewport' });

const props = defineProps<{
  document: DirectorDocument;
  frame: number;
  guides: boolean;
  joint: DirectorJoint;
  playing: boolean;
  selected: string;
  tool: 'pose' | 'rotate' | 'scale' | 'translate';
}>();
const emit = defineEmits<{
  joint: [joint: DirectorJoint];
  jointRotation: [joint: DirectorJoint, rotation: Vec3];
  seek: [frame: number];
  select: [id: string];
  transform: [id: string, position: Vec3, yaw: number, scale: Vec3];
}>();

const hostRef = ref<HTMLDivElement>();
const monitorRef = ref<HTMLDivElement>();
const failure = ref('');

let renderer: T.WebGLRenderer | undefined;
let preview: T.WebGLRenderer | undefined;
let world: DirectorWorld | undefined;
let orbit: OrbitControls | undefined;
let transform: TransformControls | undefined;
const editor = new T.PerspectiveCamera(45, 1, 0.05, 300);
const ray = new T.Raycaster();
let raf = 0;
let observer: ResizeObserver | undefined;
let start: [number, number] = [0, 0];
let wasDragging = false;
let jointStart: Vec3 = [0, 0, 0];
// 拖动前的渲染位置：接地的角色渲染时带有贴地补偿，只回写拖动的位移
let positionStart = new T.Vector3();

/** 把变换手柄挂到选中的对象（姿态编辑时为关节、机位时为相机标记） */
function attach() {
  if (!world || !transform) {
    return;
  }
  transform.detach();
  const selected = props.document.objects.find(
    (item) => item.id === props.selected,
  );
  const editable = selected?.visible && !selected.locked;
  const object =
    props.tool === 'pose'
      ? editable
        ? world.puppets.get(selected!.id)?.joints[props.joint]
        : undefined
      : props.selected === 'camera'
        ? world.cameraMarker
        : editable
          ? world.objects.get(selected!.id)
          : undefined;
  if (
    object &&
    !props.playing &&
    !(props.selected === 'camera' && props.tool !== 'translate')
  ) {
    transform.attach(object);
  }
  transform.setMode(props.tool === 'pose' ? 'rotate' : props.tool);
  transform.setSpace(props.tool === 'pose' ? 'local' : 'world');
  transform.setSize(props.tool === 'pose' ? 0.6 : 0.85);
  transform.showX = props.tool !== 'rotate';
  transform.showZ = props.tool !== 'rotate';
  transform.showY = true;
}

function resize() {
  if (renderer && hostRef.value) {
    const { width, height } = hostRef.value.getBoundingClientRect();
    renderer.setSize(Math.max(1, width), Math.max(1, height));
    editor.aspect = width / Math.max(1, height);
    editor.updateProjectionMatrix();
  }
  if (preview && world && monitorRef.value) {
    preview.setSize(
      Math.max(1, monitorRef.value.clientWidth),
      Math.max(1, monitorRef.value.clientHeight),
    );
    world.camera.aspect = props.document.aspect === '16:9' ? 16 / 9 : 9 / 16;
    world.camera.updateProjectionMatrix();
  }
}

function rebuild() {
  if (!renderer) {
    return;
  }
  transform?.detach();
  if (world) {
    if (transform) {
      world.scene.remove(transform.getHelper());
    }
    disposeDirectorWorld(world);
  }
  world = createDirectorWorld(props.document);
  if (transform) {
    world.scene.add(transform.getHelper());
  }
  resize();
  attach();
}

function handlePointerDown(event: PointerEvent) {
  start = [event.clientX, event.clientY];
  wasDragging = false;
}

/** 点击选择：对象、关节、路线上的关键帧 */
function handlePointerUp(event: PointerEvent) {
  if (!world || !renderer || wasDragging || props.playing) {
    return;
  }
  if (Math.hypot(event.clientX - start[0], event.clientY - start[1]) > 4) {
    return;
  }
  const rect = renderer.domElement.getBoundingClientRect();
  ray.setFromCamera(
    new T.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    ),
    editor,
  );
  for (const hit of ray.intersectObjects(
    [...world.objects.values(), world.guides],
    true,
  )) {
    let hidden = false;
    for (
      let ancestor: null | T.Object3D = hit.object;
      ancestor;
      ancestor = ancestor.parent
    ) {
      hidden ||= !ancestor.visible;
    }
    if (hidden) {
      continue;
    }
    for (
      let object: null | T.Object3D = hit.object;
      object;
      object = object.parent
    ) {
      if (!object.userData.objectId) {
        continue;
      }
      emit('select', object.userData.objectId);
      if (props.tool === 'pose' && object.userData.joint) {
        emit('joint', object.userData.joint);
      }
      if (object.userData.keyFrame !== undefined) {
        emit('seek', object.userData.keyFrame);
      }
      return;
    }
  }
}

function focus(mode: 'perspective' | 'selected' | 'top') {
  if (!orbit || !world) {
    return;
  }
  const target =
    mode === 'selected'
      ? (
          world.objects.get(props.selected)?.position ||
          world.cameraMarker.position
        ).clone()
      : new T.Vector3(0, 1, 0);
  if (
    mode === 'selected' &&
    props.document.objects.find((item) => item.id === props.selected)?.kind ===
      'actor'
  ) {
    target.y += 0.9;
  }
  orbit.target.copy(target);
  editor.position
    .copy(target)
    .add(
      mode === 'top'
        ? new T.Vector3(0, 14, 0.01)
        : mode === 'selected'
          ? new T.Vector3(3, 2.2, 4)
          : new T.Vector3(7, 5, 9),
    );
  editor.up.set(0, 1, 0);
  orbit.update();
}

/** 当前编辑视角设为机位：position 为机位，scale 位置传拍摄目标 */
function useView() {
  if (orbit) {
    emit(
      'transform',
      'view',
      editor.position.toArray() as Vec3,
      0,
      orbit.target.toArray() as Vec3,
    );
  }
}

onMounted(() => {
  try {
    renderer = directorRenderer();
    preview = directorRenderer();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    preview.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    hostRef.value!.append(renderer.domElement);
    monitorRef.value!.append(preview.domElement);
    editor.position.set(8, 5, 9);
    orbit = new OrbitControls(editor, renderer.domElement);
    orbit.target.set(0, 1, 0);
    orbit.enableDamping = true;
    orbit.maxDistance = 100;
    orbit.minDistance = 0.4;
    orbit.update();
    transform = new TransformControls(editor, renderer.domElement);
    transform.setSize(0.85);
    transform.addEventListener('dragging-changed', (event) => {
      if (orbit) {
        orbit.enabled = !event.value;
      }
      if (event.value) {
        wasDragging = true;
      }
    });
    transform.addEventListener('mouseDown', () => {
      const object = transform?.object;
      if (object) {
        jointStart = [
          object.rotation.x,
          object.rotation.y,
          object.rotation.z,
        ].map((value) => T.MathUtils.radToDeg(value)) as Vec3;
        positionStart = object.position.clone();
      }
    });
    transform.addEventListener('mouseUp', () => {
      const object = transform?.object;
      if (!object) {
        return;
      }
      if (props.tool === 'pose') {
        // 姿态：按拖动前后的角度差，叠加到当前帧的关节角度
        const selected = props.document.objects.find(
          (item) => item.id === props.selected,
        );
        if (!selected) {
          return;
        }
        const previous = objectAt(selected, props.frame).pose?.[
          props.joint
        ] || [0, 0, 0];
        const current = [
          object.rotation.x,
          object.rotation.y,
          object.rotation.z,
        ].map((value) => T.MathUtils.radToDeg(value));
        const rotation = current.map((value, i) =>
          Math.max(
            -180,
            Math.min(
              180,
              previous[i]! + ((value - jointStart[i]! + 540) % 360) - 180,
            ),
          ),
        ) as Vec3;
        emit('jointRotation', props.joint, rotation);
        return;
      }
      // 位置：文档中当前帧的原始坐标，加上拖动的位移；不回写渲染时的贴地补偿，避免反复拖动累加高度
      const target = props.document.objects.find(
        (item) => item.id === object.userData.objectId,
      );
      const position = target
        ? new T.Vector3(...objectAt(target, props.frame).position)
            .add(object.position)
            .sub(positionStart)
        : object.position;
      const yaw = T.MathUtils.radToDeg(object.rotation.y);
      emit(
        'transform',
        object.userData.objectId,
        position.toArray() as Vec3,
        ((yaw + 540) % 360) - 180,
        object.scale.toArray() as Vec3,
      );
    });
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    rebuild();
    observer = new ResizeObserver(resize);
    observer.observe(hostRef.value!);
    observer.observe(monitorRef.value!);
    // 渲染循环：编辑视口显示辅助线，监看画面不显示（与导出一致）
    const render = () => {
      raf = requestAnimationFrame(render);
      if (!world || !renderer || !preview) {
        return;
      }
      if (!transform?.dragging) {
        applyDirectorFrame(world, props.document, props.frame);
      }
      orbit?.update();
      world.guides.visible = props.guides;
      renderer.render(world.scene, editor);
      world.guides.visible = false;
      if (transform) {
        transform.getHelper().visible = false;
      }
      preview.render(world.scene, world.camera);
      world.guides.visible = props.guides;
      if (transform) {
        transform.getHelper().visible = !!transform.object;
      }
    };
    render();
  } catch (error) {
    failure.value = `三维视口未能启动：${error instanceof Error ? error.message : '请检查浏览器的 WebGL 支持'}`;
  }
});

watch(() => props.document, rebuild);
watch(() => [props.selected, props.joint, props.tool, props.playing], attach);

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  observer?.disconnect();
  orbit?.dispose();
  if (world && transform) {
    world.scene.remove(transform.getHelper());
  }
  transform?.dispose();
  if (world) {
    disposeDirectorWorld(world);
  }
  renderer?.domElement.removeEventListener('pointerdown', handlePointerDown);
  renderer?.domElement.removeEventListener('pointerup', handlePointerUp);
  for (const item of [renderer, preview]) {
    item?.dispose();
    item?.forceContextLoss();
    item?.domElement.remove();
  }
});

defineExpose({ focus });
</script>

<template>
  <div
    class="director-viewport relative min-h-0 min-w-0 overflow-hidden bg-[#eef2f7]"
  >
    <div ref="hostRef" class="absolute inset-0"></div>
    <div class="absolute left-3 top-3 flex gap-1.5">
      <Button size="small" @click="focus('perspective')">透视视图</Button>
      <Button size="small" @click="focus('top')">俯视布局</Button>
      <Button size="small" :disabled="!selected" @click="focus('selected')">
        聚焦选择
      </Button>
      <Button size="small" @click="useView">当前视角设为机位</Button>
    </div>
    <div
      class="pointer-events-none absolute bottom-3 left-3 text-xs text-[#606266]"
    >
      {{
        tool === 'pose'
          ? '姿态编辑：点击身体部位，再拖动旋转环'
          : '左键旋转 / 滚轮缩放 / 右键平移'
      }}
      <div class="mt-1">蓝线：人物路线；黄线：运镜路线</div>
    </div>
    <div
      class="director-monitor border-border bg-card pointer-events-none absolute bottom-3 right-3 overflow-hidden rounded-md border border-solid"
      :class="document.aspect === '9:16' ? 'w-[140px]' : 'w-[260px]'"
    >
      <div class="flex justify-between px-2.5 py-1.5 text-xs">
        <span>摄影机监看</span>
        <span class="text-muted-foreground">
          {{ document.aspect }} · {{ document.fps }} fps
        </span>
      </div>
      <div
        ref="monitorRef"
        class="w-full overflow-hidden"
        :style="{ aspectRatio: document.aspect === '16:9' ? '16/9' : '9/16' }"
      ></div>
    </div>
    <Alert
      v-if="failure"
      :message="failure"
      type="error"
      show-icon
      class="!absolute left-3 right-3 top-14"
    />
  </div>
</template>

<style lang="scss" scoped>
.director-viewport :deep(canvas) {
  display: block;
  touch-action: none;
}

.director-monitor :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
}
</style>
