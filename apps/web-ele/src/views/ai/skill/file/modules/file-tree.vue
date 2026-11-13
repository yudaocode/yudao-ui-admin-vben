<script lang="ts" setup>
import type {
  AllowDropFunction,
  AllowDropType,
  NodeDropType,
  TreeInstance,
} from 'element-plus';

import type { AiSkillApi } from '#/api/ai/skill';

import { nextTick, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, prompt } from '@vben/common-ui';
import { AiSkillFileTypeEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { handleTree } from '@vben/utils';

import { ElButton, ElMessage, ElTooltip, ElTree } from 'element-plus';

import {
  createSkillFile,
  deleteSkillFile,
  getSkillFileList,
  moveSkillFile,
  renameSkillFile,
} from '#/api/ai/skill';
import { $t } from '#/locales';

/** AI 技能文件树 */
defineOptions({ name: 'AiSkillFileTree' });

const props = defineProps<{
  skillId: number; // 技能编号
}>();

const emit = defineEmits<{
  select: [node?: AiSkillApi.SkillFile]; // 选中节点
}>();

/** el-tree 节点类型 */
type TreeNode = Parameters<AllowDropFunction>[1];

const { hasAccessByCodes } = useAccess();
const hasUpdatePermission = hasAccessByCodes(['ai:skill:update']); // 是否有修改权限
const hasDeletePermission = hasAccessByCodes(['ai:skill:delete']); // 是否有删除权限

const treeRef = ref<TreeInstance>(); // 树组件 Ref
const loading = ref(false); // 树的加载中
const fileList = ref<AiSkillApi.SkillFile[]>([]); // 文件列表（平铺）
const treeData = ref<AiSkillApi.SkillFile[]>([]); // 树的数据
const selectedNode = ref<AiSkillApi.SkillFile>(); // 当前选中的节点

/** 是否为目录节点 */
function isDirectory(node: AiSkillApi.SkillFile) {
  return node.type === AiSkillFileTypeEnum.DIRECTORY;
}

/** 加载文件树 */
async function loadTree() {
  loading.value = true;
  try {
    fileList.value = await getSkillFileList(props.skillId);
    treeData.value = handleTree(fileList.value);
  } finally {
    loading.value = false;
  }
  // 刷新选中节点：节点被删除时，取消选中
  const selectedId = selectedNode.value?.id;
  selectedNode.value = selectedId
    ? fileList.value.find((item) => item.id === selectedId)
    : undefined;
  emit('select', selectedNode.value);
  await nextTick();
  treeRef.value?.setCurrentKey(selectedNode.value?.id);
}

/** 点击节点 */
function handleNodeClick(data: AiSkillApi.SkillFile) {
  selectedNode.value = data;
  emit('select', data);
}

// ==================== 拖拽移动 ====================

/** 固定节点不可拖拽 */
function allowDrag(node: TreeNode) {
  return !node.data.locked;
}

/** 是否允许放置：拖入内部时，目标必须是目录 */
function allowDrop(
  _draggingNode: TreeNode,
  dropNode: TreeNode,
  type: AllowDropType,
) {
  return type !== 'inner' || isDirectory(dropNode.data as AiSkillApi.SkillFile);
}

/** 拖拽完成 */
async function handleNodeDrop(
  draggingNode: TreeNode,
  dropNode: TreeNode,
  dropType: NodeDropType,
) {
  const dragging = draggingNode.data as AiSkillApi.SkillFile;
  const target = dropNode.data as AiSkillApi.SkillFile;
  // 计算新的父目录：拖入内部为目标目录，否则与目标节点同级
  const parentId = dropType === 'inner' ? target.id : target.parentId;
  if (parentId === dragging.parentId) {
    await loadTree();
    return;
  }
  try {
    await moveSkillFile({ id: dragging.id, parentId });
    ElMessage.success('移动成功');
  } finally {
    // 刷新文件树
    await loadTree();
  }
}

// ==================== 新建 / 重命名 / 删除 ====================

/** 输入名称：取消时返回 undefined */
async function promptName(
  title: string,
  content: string,
  defaultValue?: string,
) {
  try {
    const result = await prompt<string>({
      title,
      content,
      defaultValue,
      beforeClose: ({ isConfirm, value }) => {
        if (isConfirm && !value?.trim()) {
          ElMessage.warning('名称不能为空');
          return false;
        }
        return true;
      },
    });
    return result?.trim();
  } catch {
    return undefined;
  }
}

/** 新建文件或目录 */
async function handleCreate(directory: boolean) {
  const node = selectedNode.value;
  const parentId = node ? (isDirectory(node) ? node.id : node.parentId) : 0;
  // 输入名称
  const name = await promptName(
    directory ? '新建目录' : '新建文件',
    directory ? '请输入目录名称' : '请输入文件名（含扩展名，如 guide.md）',
  );
  if (!name) {
    return;
  }
  // 发起新建
  await createSkillFile({
    skillId: props.skillId,
    parentId,
    name,
    type: directory ? AiSkillFileTypeEnum.DIRECTORY : AiSkillFileTypeEnum.FILE,
  });
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
  // 刷新文件树
  await loadTree();
}

/** 重命名 */
async function handleRename() {
  const node = selectedNode.value;
  if (!node || node.locked) {
    return;
  }
  // 输入新名称
  const name = await promptName('重命名', '请输入新的名称', node.name);
  if (!name) {
    return;
  }
  // 发起重命名
  await renameSkillFile({ id: node.id, name });
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
  // 刷新文件树
  await loadTree();
}

/** 删除 */
async function handleDelete() {
  const node = selectedNode.value;
  if (!node || node.locked) {
    return;
  }
  const label = isDirectory(node) ? '目录' : '文件';
  // 删除的二次确认
  try {
    await confirm(
      `是否确认删除${label}"${node.name}"？（目录将递归删除其全部内容）`,
    );
  } catch {
    return;
  }
  // 发起删除
  await deleteSkillFile(node.id);
  ElMessage.success($t('ui.actionMessage.deleteSuccess', [node.name]));
  // 刷新文件树
  await loadTree();
}

/** 初始化 */
onMounted(() => {
  loadTree();
});
</script>

<template>
  <div
    class="flex w-80 flex-shrink-0 flex-col overflow-hidden rounded-md border border-border"
  >
    <!-- 工具栏 -->
    <div
      class="flex items-center justify-between border-b border-border px-3 py-2"
    >
      <span class="font-semibold">文件</span>
      <div class="flex gap-1">
        <template v-if="hasUpdatePermission">
          <ElTooltip content="新建文件" placement="top">
            <ElButton size="small" @click="handleCreate(false)">
              <IconifyIcon icon="lucide:file-plus" />
            </ElButton>
          </ElTooltip>
          <ElTooltip content="新建目录" placement="top">
            <ElButton size="small" class="!ml-0" @click="handleCreate(true)">
              <IconifyIcon icon="lucide:folder-plus" />
            </ElButton>
          </ElTooltip>
          <ElTooltip content="重命名" placement="top">
            <ElButton
              size="small"
              class="!ml-0"
              :disabled="!selectedNode || selectedNode.locked"
              @click="handleRename"
            >
              <IconifyIcon icon="lucide:pencil" />
            </ElButton>
          </ElTooltip>
        </template>
        <ElTooltip v-if="hasDeletePermission" content="删除" placement="top">
          <ElButton
            size="small"
            type="danger"
            plain
            class="!ml-0"
            :disabled="!selectedNode || selectedNode.locked"
            @click="handleDelete"
          >
            <IconifyIcon icon="lucide:trash-2" />
          </ElButton>
        </ElTooltip>
      </div>
    </div>
    <!-- 文件树 -->
    <div
      v-loading="loading"
      class="relative min-h-0 flex-1 overflow-auto px-1.5 py-2"
    >
      <ElTree
        ref="treeRef"
        :data="treeData"
        node-key="id"
        :props="{ children: 'children', label: 'name' }"
        default-expand-all
        :expand-on-click-node="false"
        highlight-current
        :draggable="hasUpdatePermission"
        :allow-drag="allowDrag"
        :allow-drop="allowDrop"
        @node-click="handleNodeClick"
        @node-drop="handleNodeDrop"
      >
        <template #default="{ data }">
          <span class="flex w-full items-center gap-1 overflow-hidden">
            <IconifyIcon
              class="flex-shrink-0"
              :icon="isDirectory(data) ? 'lucide:folder' : 'lucide:file'"
            />
            <span class="truncate">{{ data.name }}</span>
            <ElTooltip
              v-if="data.locked"
              content="固定文件/目录不可删除、改名或移动"
            >
              <IconifyIcon
                icon="lucide:lock"
                class="ml-auto mr-2 flex-shrink-0 text-yellow-500"
              />
            </ElTooltip>
          </span>
        </template>
      </ElTree>
    </div>
  </div>
</template>
