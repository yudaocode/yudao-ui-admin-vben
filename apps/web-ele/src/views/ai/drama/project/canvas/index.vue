<script lang="ts" setup>
import type {
  Connection,
  EdgeMouseEvent,
  NodeDragEvent,
  NodeMouseEvent,
  OnConnectStartParams,
} from '@vue-flow/core';

import type {
  DramaCanvasDocument,
  DramaCanvasKind,
  DramaCanvasNode,
} from './canvas';

import type { AiDramaProjectApi } from '#/api/ai/drama/project';
import type { AiModelModelApi } from '#/api/ai/model/model';

import {
  computed,
  defineAsyncComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';

import { confirm } from '@vben/common-ui';
import {
  AiModelTypeEnum,
  AiPlatformEnum,
  AiVideoTypeEnum,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { Background } from '@vue-flow/background';
import { MarkerType, useVueFlow, VueFlow } from '@vue-flow/core';
import { MiniMap } from '@vue-flow/minimap';
import { until } from '@vueuse/core';
import {
  ElButton,
  ElCheckbox,
  ElDivider,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElEmpty,
  ElMessage,
  ElRadioButton,
  ElRadioGroup,
  ElTooltip,
} from 'element-plus';

import { getDramaCanvas, saveDramaCanvas } from '#/api/ai/drama/canvas';
import { getDramaProjectDetailMy } from '#/api/ai/drama/project';
import { getModelSimpleList } from '#/api/ai/model/model';
import { getSelectedImageUrl } from '#/views/ai/utils/drama';
import { isVideoModelOfType } from '#/views/ai/utils/video';

import ComposeForm from '../form/modules/storyboard/compose-form.vue';
import {
  cloneDramaCanvasNodes,
  DRAMA_CANVAS_ADD_KINDS,
  DRAMA_CANVAS_ICONS,
  DRAMA_CANVAS_LABELS,
  emptyDramaCanvas,
  getDramaCanvasDownstreamKinds,
  getDramaConnectionIssue,
  getOrderedDramaCanvasVideos,
  groupDramaCanvasNodes,
  newDramaCanvasNode,
  removeDramaCanvasNodes,
} from './canvas';
import CanvasInspector from './modules/canvas-inspector.vue';
import CanvasNodeCard from './modules/canvas-node-card.vue';
import ResourceGraph from './modules/resource-graph.vue';
import { useDramaAutoSave } from './use-auto-save';
import { useCanvasExecution } from './use-canvas-execution';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/minimap/dist/style.css';

/** AI 短剧：画布。节点创建、连接、编辑后保存为项目的画布文档；节点执行调用剧本、资产、分镜接口；资源关系图按项目业务数据构建 */
defineOptions({ name: 'AiDramaCanvas' });

const props = defineProps<{ detail: AiDramaProjectApi.ProjectDetail }>();

const emit = defineEmits<{ refresh: [] }>();

// 3D 导演：首次打开时再加载
const DirectorStudio = defineAsyncComponent(
  () => import('../director/index.vue'),
);

const projectId = props.detail.project.id;
const flowId = `drama-canvas-${projectId}`;
const {
  fitView,
  setViewport,
  viewport,
  getSelectedNodes,
  getSelectedEdges,
  zoomIn,
  zoomOut,
} = useVueFlow(flowId);

/** 悬浮在画布上的工具条：左侧添加节点、左下视图、选中后的浮动操作 */
const TOOLBAR_CLASS =
  'bg-card border-border absolute z-[5] flex gap-0.5 rounded-md border p-1 shadow-sm';
const TOOL_CLASS =
  'text-foreground hover:bg-accent flex w-[52px] cursor-pointer flex-col items-center gap-0.5 rounded border-none bg-transparent py-1.5 text-xs';
const MENU_ITEM_CLASS =
  'hover:bg-accent flex cursor-pointer items-center gap-1.5 border-none bg-transparent px-3 py-1.5 text-left text-[13px] disabled:cursor-not-allowed disabled:opacity-50';

const mode = ref<'resource' | 'workflow'>('workflow');
const tool = ref<'pan' | 'select'>('pan'); // 左侧工具条：拖动时框选节点，或平移画布
const loading = ref(false);
const loaded = ref(false);
const saving = ref(false);
const doc = ref<DramaCanvasDocument>(emptyDramaCanvas());
const revision = ref(0);
const savedJson = ref(''); // 上次保存（或加载）的文档，用于判断是否有未保存的修改
const docJson = computed(() => JSON.stringify(doc.value));
const dirty = computed(() => docJson.value !== savedJson.value);
const inspectorId = ref('');
const inspectorNode = computed(() =>
  doc.value.nodes.find((item) => item.id === inspectorId.value),
);
const flowRef = ref<HTMLElement>();
const directorVisible = ref(false); // 是否已打开过 3D 导演
const directorRef = ref<{
  confirmLeave: () => Promise<boolean>;
  dirty: boolean;
  open: (id: string, nodeTitle: string, sourceNodeId?: string) => void;
}>();
const composeRef = ref<InstanceType<typeof ComposeForm>>();

const imageModels = ref<AiModelModelApi.Model[]>([]);
const videoModels = ref<AiModelModelApi.Model[]>([]);
const voiceModels = ref<AiModelModelApi.Model[]>([]);

/** 项目详情：执行节点时需要即时的业务数据，自行加载；父页面的轮询结果同步过来 */
const detail = ref<AiDramaProjectApi.ProjectDetail>(props.detail);
watch(
  () => props.detail,
  (value) => (detail.value = value),
);
async function handleRefresh() {
  detail.value = await getDramaProjectDetailMy(projectId);
  emit('refresh');
}

// ========== 文档：加载、保存 ==========

/** 等待进行中的保存结束：多个等待者依次醒来时，重新检查，保证同一时间只有一次保存 */
async function waitSaved() {
  while (saving.value) {
    await until(saving).toBe(false);
  }
}

/** 加载代次：每次加载（包括重新加载）递增；保存的回包只在代次不变时写入修订号与保存基线 */
let generation = 0;

async function loadCanvas() {
  const current = ++generation;
  autoSave.cancel();
  loading.value = true;
  try {
    // 先等在途的保存结束，再加载：加载结果的修订号不被旧的回包覆盖
    await waitSaved();
    const data = await getDramaCanvas(projectId);
    if (current !== generation) {
      return;
    }
    revision.value = data.revision;
    doc.value = (data.document as DramaCanvasDocument) || emptyDramaCanvas();
    savedJson.value = JSON.stringify(doc.value);
    autoSave.reset();
    inspectorId.value = '';
    loaded.value = true;
  } finally {
    // 只由最后一次加载结束遮罩：连续重新加载时，先返回的旧请求不提前解除
    if (current === generation) {
      loading.value = false;
    }
  }
}

/**
 * 保存画布：修订号不一致时后端拒绝，提示重新加载
 *
 * 手动保存、自动保存、执行节点后的保存依次进行：上一次未结束时先等待，避免以同一修订号重复提交；
 * 调用时记录加载代次：等待期间开始了重新加载（或正在加载）时放弃保存，不以旧文档提交；
 * 保存期间重新加载了画布时，回包不再写入（以新加载的修订号与文档为准）
 */
async function persist() {
  const current = generation;
  // 检查与占用在同一同步段内完成：多个等待者醒来时，只有第一个能占用，其余继续等待
  while (saving.value) {
    await until(saving).toBe(false);
  }
  // 只保存当前代次已加载成功的文档：加载中、加载失败（以重新加载重试）时不保存
  if (current !== generation || loading.value || !loaded.value) {
    return false;
  }
  saving.value = true;
  try {
    doc.value.viewport = {
      x: viewport.value.x,
      y: viewport.value.y,
      zoom: viewport.value.zoom,
    };
    // 以本次提交的文档为保存基线：保存期间的后续修改仍为未保存
    const json = JSON.stringify(doc.value);
    const nextRevision = await saveDramaCanvas({
      projectId,
      revision: revision.value,
      document: JSON.parse(json),
    });
    if (current === generation) {
      revision.value = nextRevision;
      savedJson.value = json;
    }
    return true;
  } catch {
    return false;
  } finally {
    saving.value = false;
  }
}

async function handleSave() {
  if (await persist()) {
    ElMessage.success('画布已保存');
    autoSave.resume();
  }
}

/** 自动保存：默认关闭，勾选后编辑停顿时保存；失败后暂停，手动保存成功后恢复 */
const autoSave = useDramaAutoSave({
  storageKey: 'ai-drama-canvas-auto-save',
  snapshot: () => docJson.value,
  dirty,
  saving,
  ready: () => loaded.value && !loading.value && !saving.value,
  save: persist,
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

function handleMore(command: string) {
  if (command === 'compose') {
    handleCompose();
  } else if (command === 'reload') {
    handleReload();
  }
}

async function handleReload() {
  if (dirty.value) {
    try {
      await confirm('重新加载会丢弃未保存的修改，确认继续？');
    } catch {
      return;
    }
  }
  loaded.value = false;
  await loadCanvas();
}

/** 打开过的视口；首次没有时适应画布 */
async function handleInitialized() {
  if (doc.value.viewport) {
    await setViewport(doc.value.viewport);
  } else if (doc.value.nodes.length > 0) {
    await fitView({ padding: 0.2, maxZoom: 0.9 });
  }
}

// ========== 节点、连线 ==========

const flowNodes = computed(() =>
  doc.value.nodes.map((item) => ({
    id: item.id,
    type: 'canvas',
    position: item.position,
    data: item,
    zIndex: item.kind === 'group' ? -1 : 1,
    connectable: item.kind !== 'group',
  })),
);
const flowEdges = computed(() =>
  doc.value.edges.map((edge) => ({
    ...edge,
    markerEnd: MarkerType.ArrowClosed,
    interactionWidth: 16,
  })),
);

/** 添加节点：未指定位置时，放在当前视口的中间 */
function handleAdd(
  kind: DramaCanvasKind,
  position?: DramaCanvasNode['position'],
) {
  const width = flowRef.value?.clientWidth || 800;
  const height = flowRef.value?.clientHeight || 600;
  const { x, y, zoom } = viewport.value;
  const offset = (doc.value.nodes.length % 5) * 24;
  const node = newDramaCanvasNode(
    kind,
    position || {
      x: (width / 2 - x) / zoom - 140 + offset,
      y: (height / 2 - y) / zoom - 120 + offset,
    },
  );
  if (kind === 'video') {
    node.data.order =
      doc.value.nodes.filter((item) => item.kind === 'video').length + 1;
  }
  doc.value.nodes.push(node);
  inspectorId.value = node.id;
  return node;
}

/**
 * 连线校验：拖出新连线时按业务规则校验
 *
 * Vue Flow 写入 edges（例如重新加载、连线变化）时，也会用它校验每条已有连线；已在文档中的连线直接通过，
 * 否则会被判为“连线已存在”而丢弃
 */
function isValidConnection(connection: Connection) {
  return (
    ('id' in connection &&
      doc.value.edges.some((edge) => edge.id === connection.id)) ||
    !getDramaConnectionIssue(doc.value, connection.source, connection.target)
  );
}

function handleConnect(connection: Connection) {
  if (connecting) {
    connecting.connected = true;
  }
  const issue = getDramaConnectionIssue(
    doc.value,
    connection.source,
    connection.target,
  );
  if (issue) {
    ElMessage.warning(issue);
    return;
  }
  doc.value.edges.push({
    id: crypto.randomUUID(),
    source: connection.source,
    target: connection.target,
  });
}

// ========== 右键菜单；从连接点拖到空白处创建下游节点 ==========

interface CanvasMenu {
  type: 'downstream' | 'edge' | 'node';
  x: number; // 菜单在画布容器内的位置
  y: number;
  nodeIds: string[]; // 节点菜单：操作的节点
  edgeId?: string; // 连线菜单：操作的连线
  sourceId?: string; // 下游菜单：上游节点
  position?: DramaCanvasNode['position']; // 下游菜单：新节点在画布中的位置
  kinds?: DramaCanvasKind[]; // 下游菜单：可创建的节点种类
}
const menu = ref<CanvasMenu>();

/** 鼠标位置：画布容器内的位置，以及画布坐标 */
function getPointer(event: MouseEvent | TouchEvent) {
  const point = 'changedTouches' in event ? event.changedTouches[0]! : event;
  const rect = flowRef.value!.getBoundingClientRect();
  const { x, y, zoom } = viewport.value;
  const left = point.clientX - rect.left;
  const top = point.clientY - rect.top;
  return {
    clientX: point.clientX,
    clientY: point.clientY,
    x: Math.min(left, rect.width - 160),
    y: Math.min(top, rect.height - 200),
    position: { x: (left - x) / zoom, y: (top - y) / zoom },
  };
}

/** 菜单项：先执行（执行时读取菜单的参数），再关闭菜单 */
function runMenu(action: () => unknown) {
  action();
  menu.value = undefined;
}

function selectedNodeIds() {
  return getSelectedNodes.value.map((item) => item.id);
}

/** 节点右键：右键的节点在多选中时，操作全部选中的节点；否则只操作该节点 */
function handleNodeMenu({ event, node }: NodeMouseEvent) {
  event.preventDefault();
  const selected = selectedNodeIds();
  const pointer = getPointer(event);
  menu.value = {
    type: 'node',
    x: pointer.x,
    y: pointer.y,
    nodeIds: selected.includes(node.id) ? selected : [node.id],
  };
}

function handleEdgeMenu({ event, edge }: EdgeMouseEvent) {
  event.preventDefault();
  const pointer = getPointer(event);
  menu.value = {
    type: 'edge',
    x: pointer.x,
    y: pointer.y,
    nodeIds: [],
    edgeId: edge.id,
  };
}

function handleNodeClick({ node }: NodeMouseEvent) {
  inspectorId.value = node.id;
  menu.value = undefined;
}

/**
 * 拖线松开在空白处后，浏览器会在同一次松开时向画布派发 click（按下的连接点与松开处的共同祖先是画布），
 * 而 vue-flow 此时已结束连线、会触发 pane-click：短时间内忽略，避免刚弹出的下游菜单被关闭
 */
let skipPaneClickUntil = 0;

function handlePaneClick() {
  if (Date.now() < skipPaneClickUntil) {
    return;
  }
  inspectorId.value = '';
  menu.value = undefined;
}

/** 进行中的拖线：只记录从输出（右侧）连接点拖出的 */
let connecting: undefined | { connected: boolean; sourceId: string };
function handleConnectStart({ nodeId, handleType }: OnConnectStartParams) {
  menu.value = undefined;
  connecting =
    nodeId && handleType === 'source'
      ? { sourceId: nodeId, connected: false }
      : undefined;
}

/** 拖线结束：没有连到节点、松开在空白处时，弹出可创建的下游节点 */
function handleConnectEnd(event?: MouseEvent | TouchEvent) {
  const state = connecting;
  connecting = undefined;
  if (!state || state.connected || !event || !flowRef.value) {
    return;
  }
  const pointer = getPointer(event);
  const element = document.elementFromPoint(pointer.clientX, pointer.clientY);
  if (
    !element?.closest('.vue-flow__pane') ||
    element.closest('.vue-flow__node')
  ) {
    return;
  }
  const source = doc.value.nodes.find((item) => item.id === state.sourceId);
  const kinds = source ? getDramaCanvasDownstreamKinds(source.kind) : [];
  if (kinds.length === 0) {
    ElMessage.warning(
      source?.kind === 'previs'
        ? '预演不直接作为输入：请在 3D 导演中导出视频，加入动作参考后在镜头中选用'
        : '该节点没有可创建的下游节点',
    );
    return;
  }
  skipPaneClickUntil = Date.now() + 300;
  menu.value = {
    type: 'downstream',
    x: pointer.x,
    y: pointer.y,
    nodeIds: [],
    sourceId: state.sourceId,
    position: pointer.position,
    kinds,
  };
}

/** 创建下游节点并连线：不满足连线规则（例如声音只能关联角色图片）时撤销 */
function handleAddDownstream(kind: DramaCanvasKind) {
  const { sourceId, position } = menu.value!;
  const node = handleAdd(kind, { x: position!.x, y: position!.y - 60 });
  const issue = getDramaConnectionIssue(doc.value, sourceId!, node.id);
  if (issue) {
    removeDramaCanvasNodes(doc.value, [node.id]);
    inspectorId.value = '';
    ElMessage.warning(issue);
    return;
  }
  doc.value.edges.push({
    id: crypto.randomUUID(),
    source: sourceId!,
    target: node.id,
  });
}

/** 拖动结束：写回位置；拖动分组时，组内节点一起移动 */
function handleDragStop({ nodes }: NodeDragEvent) {
  nodes.forEach((dragged) => {
    const node = doc.value.nodes.find((item) => item.id === dragged.id);
    if (!node) {
      return;
    }
    const dx = dragged.position.x - node.position.x;
    const dy = dragged.position.y - node.position.y;
    node.position = { x: dragged.position.x, y: dragged.position.y };
    if (node.kind === 'group') {
      doc.value.nodes
        .filter(
          (item) =>
            item.parentId === node.id &&
            !nodes.some((other) => other.id === item.id),
        )
        .forEach(
          (item) =>
            (item.position = {
              x: item.position.x + dx,
              y: item.position.y + dy,
            }),
        );
    }
  });
}

/** 能否成组：分组不嵌套，至少有一个非分组节点 */
function canGroup(ids: string[]) {
  return doc.value.nodes.some(
    (item) => ids.includes(item.id) && item.kind !== 'group',
  );
}

function handleGroup(ids: string[]) {
  if (!groupDramaCanvasNodes(doc.value, ids)) {
    ElMessage.warning('请选择要成组的节点');
  }
}

function handleClone(ids: string[]) {
  const nodes = cloneDramaCanvasNodes(doc.value, ids);
  ElMessage.success(
    `已复制 ${nodes.length} 个节点；副本不关联原业务数据，保存到项目时新建`,
  );
}

/** 移除节点、连线：只移除画布中的，不删除已保存到项目的剧本、资产、分镜 */
async function handleDelete(nodeIds: string[], edgeIds: string[] = []) {
  if (nodeIds.length > 0) {
    try {
      await confirm(
        `确认移除 ${nodeIds.length} 个节点？已保存到项目的数据不会删除`,
      );
    } catch {
      return;
    }
    removeDramaCanvasNodes(doc.value, nodeIds);
  }
  doc.value.edges = doc.value.edges.filter(
    (edge) => !edgeIds.includes(edge.id),
  );
  if (nodeIds.includes(inspectorId.value)) {
    inspectorId.value = '';
  }
}

function handleDoubleClick(id: string) {
  const node = doc.value.nodes.find((item) => item.id === id);
  if (node?.kind === 'previs') {
    handleOpenDirector(id);
  } else {
    inspectorId.value = id;
  }
}

// ========== 节点关联的业务数据：状态、图片、视频 ==========

function getBusinessStatus(node: DramaCanvasNode) {
  const business = node.data.business;
  if (!business) {
    return undefined;
  }
  if (business.type === 'character' && node.kind === 'image') {
    return detail.value.characters
      .find((item) => item.id === business.id)
      ?.appearances.find((item) => item.id === business.appearanceId)?.status;
  }
  if (business.type === 'location') {
    return detail.value.locations.find((item) => item.id === business.id)
      ?.status;
  }
  if (business.type === 'prop') {
    return detail.value.visualAssets.find((item) => item.id === business.id)
      ?.status;
  }
  if (business.type === 'storyboard') {
    return detail.value.storyboards.find((item) => item.id === business.id)
      ?.videoStatus;
  }
  return undefined;
}

/** 图片：选用的候选图，其次参考图 */
function getImageUrl(node: DramaCanvasNode) {
  const business = node.data.business;
  if (node.kind !== 'image' || !business) {
    return node.data.url;
  }
  if (business.type === 'character') {
    const appearance = detail.value.characters
      .find((item) => item.id === business.id)
      ?.appearances.find((item) => item.id === business.appearanceId);
    return (
      getSelectedImageUrl(appearance?.imageUrls, appearance?.selectedIndex) ||
      node.data.url
    );
  }
  if (business.type === 'location') {
    const location = detail.value.locations.find(
      (item) => item.id === business.id,
    );
    return (
      getSelectedImageUrl(location?.imageUrls, location?.selectedIndex) ||
      node.data.url
    );
  }
  return (
    detail.value.visualAssets.find((item) => item.id === business.id)
      ?.imageUrl || node.data.url
  );
}

function getVideoUrl(node: DramaCanvasNode) {
  const business = node.data.business;
  if (business?.type !== 'storyboard') {
    return undefined;
  }
  return detail.value.storyboards.find((item) => item.id === business.id)
    ?.videoUrl;
}

// ========== 执行 ==========

const execution = useCanvasExecution({
  projectId,
  detail,
  doc,
  patch: (id, data) => {
    const node = doc.value.nodes.find((item) => item.id === id);
    if (node) {
      Object.assign(node.data, data);
    }
  },
  persist,
  refresh: async () => {
    detail.value = await getDramaProjectDetailMy(projectId);
  },
});

/** 执行节点：成功后保存画布（节点可能写入了业务编号、正文），并通知项目页刷新 */
async function handleRun(action: () => Promise<boolean>, successText: string) {
  try {
    if (!(await action())) {
      return;
    }
    await persist();
    ElMessage.success(successText);
  } finally {
    emit('refresh');
  }
}

async function handlePlan() {
  try {
    await confirm('拆分分镜会先分析角色场景，再替换当前剧本的分镜，确认继续？');
  } catch {
    return;
  }
  await handleRun(() => execution.plan(inspectorNode.value!.id), '已拆分分镜');
}

/** 打开 3D 导演：预演节点需已保存在画布中 */
async function handleOpenDirector(id: string) {
  if (dirty.value && !(await persist())) {
    return;
  }
  const node = doc.value.nodes.find((item) => item.id === id)!;
  // 首次打开时渲染并加载 3D 导演；加载完成后 ref 才指向组件
  directorVisible.value = true;
  await until(() => !!directorRef.value).toBe(true);
  directorRef.value!.open(id, node.data.title, node.data.directorSourceId);
}

/** 导演工程保存后，摘要写入预演节点的说明 */
function handleDirectorSaved(id: string, summary: string) {
  const node = doc.value.nodes.find((item) => item.id === id);
  if (node) {
    node.data.content = summary;
  }
}

/** 按画布中视频节点的顺序合成成片 */
function handleCompose() {
  const storyboardIds = getOrderedDramaCanvasVideos(doc.value)
    .map((item) => item.data.business?.id)
    .filter((id): id is number => !!id);
  if (storyboardIds.length === 0) {
    ElMessage.warning('画布中还没有保存到项目的视频节点');
    return;
  }
  composeRef.value?.open(storyboardIds);
}

/**
 * 离开画布前（返回、切到分步、应用内跳转）：先处理打开的 3D 导演；开启自动保存时立即保存，保存成功后直接离开；
 * 手动保存模式、自动保存失败时仍有未保存的修改，确认后离开
 *
 * @return 是否可以离开
 */
async function confirmLeave() {
  if (directorRef.value && !(await directorRef.value.confirmLeave())) {
    return false;
  }
  if (loaded.value && dirty.value && autoSave.enabled.value) {
    await autoSave.flush();
  }
  if (!dirty.value) {
    return true;
  }
  try {
    await confirm('画布有未保存的修改，确认离开？');
    return true;
  } catch {
    return false;
  }
}

/** 关闭、刷新页面前：浏览器只能弹出原生确认；开启自动保存时尽量先发起保存 */
function handleBeforeUnload(event: BeforeUnloadEvent) {
  const directorDirty = !!directorRef.value?.dirty;
  if (!dirty.value && !directorDirty) {
    return;
  }
  if (dirty.value && autoSave.enabled.value && !autoSave.paused.value) {
    autoSave.flush();
  }
  event.preventDefault();
  event.returnValue = '';
}
defineExpose({ dirty, confirmLeave });

/** 初始化 */
onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  await loadCanvas();
  // Midjourney 不支持，不展示
  imageModels.value = (await getModelSimpleList(AiModelTypeEnum.IMAGE)).filter(
    (item) => item.platform !== AiPlatformEnum.MIDJOURNEY,
  );
  videoModels.value = (await getModelSimpleList(AiModelTypeEnum.VIDEO)).filter(
    (item) =>
      isVideoModelOfType(AiVideoTypeEnum.GENERATE, item.platform, item.model),
  );
  voiceModels.value = await getModelSimpleList(AiModelTypeEnum.VOICE);
});
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<template>
  <div>
    <!-- 顶部：只放画布级操作；添加节点在左侧工具条，节点操作在右键菜单 -->
    <div class="bg-card mb-4 rounded-lg p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <ElRadioGroup v-model="mode">
          <ElRadioButton value="workflow">工作流画布</ElRadioButton>
          <ElRadioButton value="resource">资源关系图</ElRadioButton>
        </ElRadioGroup>
        <div class="flex flex-wrap items-center gap-2">
          <ElDropdown
            v-if="mode === 'workflow'"
            trigger="click"
            @command="(command) => handleMore(String(command))"
          >
            <ElButton>
              更多
              <IconifyIcon icon="lucide:chevron-down" class="ml-1 inline" />
            </ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem command="compose">
                  按画布顺序合成
                </ElDropdownItem>
                <ElDropdownItem command="reload">重新加载</ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
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
          <ElCheckbox v-model="autoSave.enabled.value">自动保存</ElCheckbox>
          <ElButton
            type="primary"
            :loading="saving"
            :disabled="!dirty || loading || !loaded"
            @click="handleSave"
          >
            保存画布
          </ElButton>
        </div>
      </div>
    </div>

    <div
      class="bg-background border-border relative flex h-[calc(100vh-260px)] min-h-[560px] overflow-hidden rounded border"
    >
      <div
        v-if="loading"
        v-loading="true"
        class="bg-background/60 absolute inset-0 z-20"
      ></div>
      <template v-if="mode === 'workflow'">
        <div ref="flowRef" class="relative min-w-0 flex-1">
          <VueFlow
            v-if="loaded"
            :id="flowId"
            :nodes="flowNodes"
            :edges="flowEdges"
            :min-zoom="0.08"
            :max-zoom="2"
            :delete-key-code="null"
            :zoom-on-double-click="false"
            :multi-selection-key-code="['Control', 'Meta']"
            :pan-on-drag="tool === 'pan'"
            :selection-key-code="tool === 'select' ? true : 'Shift'"
            :is-valid-connection="isValidConnection"
            @nodes-initialized="handleInitialized"
            @connect="handleConnect"
            @connect-start="handleConnectStart"
            @connect-end="handleConnectEnd"
            @node-click="handleNodeClick"
            @node-double-click="({ node }) => handleDoubleClick(node.id)"
            @node-context-menu="handleNodeMenu"
            @edge-context-menu="handleEdgeMenu"
            @node-drag-stop="handleDragStop"
            @pane-click="handlePaneClick"
            @move-start="menu = undefined"
          >
            <Background :gap="22" :size="1" />
            <MiniMap pannable zoomable :width="150" :height="100" />
            <template #node-canvas="{ id, data, selected }">
              <CanvasNodeCard
                :node="data"
                :selected="selected || inspectorId === id"
                :status="getBusinessStatus(data)"
                :image-url="getImageUrl(data)"
                :video-url="getVideoUrl(data)"
              />
            </template>
          </VueFlow>
          <ElEmpty
            v-if="loaded && doc.nodes.length === 0"
            class="pointer-events-none absolute left-1/2 top-1/3 max-w-[480px] -translate-x-1/2"
            description="从左侧工具条添加节点：文本、剧本、图片、视频、声音、3D 导演；从节点右侧圆点拖到另一节点建立连线，拖到空白处创建下游节点"
          />

          <!-- 左侧工具条：添加节点；选择、移动画布 -->
          <div
            v-if="loaded"
            :class="TOOLBAR_CLASS"
            class="left-3 top-3 flex-col"
          >
            <ElTooltip
              v-for="item in DRAMA_CANVAS_ADD_KINDS"
              :key="item"
              :content="`添加${DRAMA_CANVAS_LABELS[item]}节点`"
              placement="right"
            >
              <button
                type="button"
                :class="TOOL_CLASS"
                @click="handleAdd(item)"
              >
                <IconifyIcon :icon="DRAMA_CANVAS_ICONS[item]" class="size-4" />
                <span>{{ DRAMA_CANVAS_LABELS[item] }}</span>
              </button>
            </ElTooltip>
            <ElDivider class="!my-1" />
            <ElTooltip content="拖动框选节点" placement="right">
              <button
                type="button"
                :class="[
                  TOOL_CLASS,
                  tool === 'select' && 'text-primary bg-primary/10',
                ]"
                @click="tool = 'select'"
              >
                <IconifyIcon icon="lucide:mouse-pointer-2" class="size-4" />
                <span>选择</span>
              </button>
            </ElTooltip>
            <ElTooltip
              content="拖动平移画布；按住 Shift 框选"
              placement="right"
            >
              <button
                type="button"
                :class="[
                  TOOL_CLASS,
                  tool === 'pan' && 'text-primary bg-primary/10',
                ]"
                @click="tool = 'pan'"
              >
                <IconifyIcon icon="lucide:move" class="size-4" />
                <span>移动</span>
              </button>
            </ElTooltip>
          </div>

          <!-- 左下：视图 -->
          <div
            v-if="loaded"
            :class="TOOLBAR_CLASS"
            class="bottom-3 left-3 items-center"
          >
            <ElButton
              link
              type="primary"
              size="small"
              class="!ml-0"
              @click="zoomOut()"
            >
              <IconifyIcon icon="lucide:minus" />
            </ElButton>
            <span class="w-10 text-center text-xs">
              {{ Math.round(viewport.zoom * 100) }}%
            </span>
            <ElButton
              link
              type="primary"
              size="small"
              class="!ml-0"
              @click="zoomIn()"
            >
              <IconifyIcon icon="lucide:plus" />
            </ElButton>
            <ElButton
              link
              type="primary"
              size="small"
              class="!ml-0"
              @click="fitView({ padding: 0.2, maxZoom: 0.9 })"
            >
              适应画布
            </ElButton>
          </div>

          <!-- 选中多个节点或连线时的浮动操作 -->
          <div
            v-if="getSelectedNodes.length > 1 || getSelectedEdges.length > 0"
            :class="TOOLBAR_CLASS"
            class="left-1/2 top-3 items-center -translate-x-1/2"
          >
            <span class="text-muted-foreground px-1 text-xs">
              已选
              {{
                getSelectedNodes.length > 0
                  ? `${getSelectedNodes.length} 个节点`
                  : ''
              }}
              {{
                getSelectedEdges.length > 0
                  ? `${getSelectedEdges.length} 条连线`
                  : ''
              }}
            </span>
            <template v-if="getSelectedNodes.length > 0">
              <ElButton
                link
                type="primary"
                size="small"
                class="!ml-0"
                @click="handleGroup(selectedNodeIds())"
              >
                成组
              </ElButton>
              <ElButton
                link
                type="primary"
                size="small"
                class="!ml-0"
                @click="handleClone(selectedNodeIds())"
              >
                复制
              </ElButton>
            </template>
            <ElButton
              link
              type="danger"
              size="small"
              class="!ml-0"
              @click="
                handleDelete(
                  selectedNodeIds(),
                  getSelectedEdges.map((item) => item.id),
                )
              "
            >
              移除
            </ElButton>
          </div>

          <!-- 右键菜单：节点的编辑、复制、成组、移除；连线的移除；拖到空白处时选择下游节点 -->
          <div
            v-if="menu"
            class="bg-card border-border absolute z-10 flex min-w-[140px] flex-col rounded border py-1 shadow-md"
            :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
            @contextmenu.prevent
          >
            <template v-if="menu.type === 'node'">
              <button
                v-if="menu.nodeIds.length === 1"
                type="button"
                :class="MENU_ITEM_CLASS"
                @click="runMenu(() => handleDoubleClick(menu!.nodeIds[0]!))"
              >
                <IconifyIcon icon="lucide:pencil" /> 编辑
              </button>
              <button
                type="button"
                :class="MENU_ITEM_CLASS"
                @click="runMenu(() => handleClone(menu!.nodeIds))"
              >
                <IconifyIcon icon="lucide:copy" /> 复制
              </button>
              <button
                type="button"
                :class="MENU_ITEM_CLASS"
                :disabled="!canGroup(menu.nodeIds)"
                @click="runMenu(() => handleGroup(menu!.nodeIds))"
              >
                <IconifyIcon icon="lucide:folder-plus" /> 成组
              </button>
              <button
                type="button"
                :class="MENU_ITEM_CLASS"
                class="text-destructive"
                @click="runMenu(() => handleDelete(menu!.nodeIds))"
              >
                <IconifyIcon icon="lucide:trash-2" /> 移除
              </button>
            </template>
            <button
              v-else-if="menu.type === 'edge'"
              type="button"
              :class="MENU_ITEM_CLASS"
              class="text-destructive"
              @click="runMenu(() => handleDelete([], [menu!.edgeId!]))"
            >
              <IconifyIcon icon="lucide:trash-2" /> 移除连线
            </button>
            <template v-else>
              <div class="text-muted-foreground px-2.5 py-1 text-xs">
                创建下游节点
              </div>
              <button
                v-for="item in menu.kinds"
                :key="item"
                type="button"
                :class="MENU_ITEM_CLASS"
                @click="runMenu(() => handleAddDownstream(item))"
              >
                <IconifyIcon :icon="DRAMA_CANVAS_ICONS[item]" />
                {{ DRAMA_CANVAS_LABELS[item] }}
              </button>
            </template>
          </div>
        </div>
        <CanvasInspector
          v-if="inspectorNode"
          :key="inspectorNode.id"
          :node="inspectorNode"
          :doc="doc"
          :detail="detail"
          :image-models="imageModels"
          :video-models="videoModels"
          :voice-models="voiceModels"
          :busy="execution.busy.value"
          @close="inspectorId = ''"
          @sync="
            handleRun(() => execution.sync(inspectorNode!.id), '已保存到项目')
          "
          @generate="
            handleRun(
              () => execution.generate(inspectorNode!.id),
              '已提交生成，完成后自动刷新',
            )
          "
          @plan="handlePlan"
          @select-image="
            (index) =>
              handleRun(
                () => execution.selectImage(inspectorNode!.id, index),
                '已选用',
              )
          "
          @remove-edge="
            (id) => (doc.edges = doc.edges.filter((edge) => edge.id !== id))
          "
          @open-director="handleOpenDirector(inspectorNode!.id)"
        />
      </template>
      <ResourceGraph
        v-else
        :detail="detail"
        class="flex-1"
        @refresh="handleRefresh"
      />
    </div>

    <DirectorStudio
      v-if="directorVisible"
      ref="directorRef"
      :detail="detail"
      @saved="handleDirectorSaved"
      @refresh="handleRefresh"
    />
    <ComposeForm ref="composeRef" :detail="detail" @success="emit('refresh')" />
  </div>
</template>
