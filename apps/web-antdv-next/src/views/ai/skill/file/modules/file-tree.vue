<script lang="ts" setup>
import type { AiSkillApi } from '#/api/ai/skill';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, prompt } from '@vben/common-ui';
import { AiSkillFileTypeEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { handleTree } from '@vben/utils';

import { Button, message, Tooltip, Tree } from 'antdv-next';

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

const { hasAccessByCodes } = useAccess();
const hasUpdatePermission = hasAccessByCodes(['ai:skill:update']); // 是否有修改权限
const hasDeletePermission = hasAccessByCodes(['ai:skill:delete']); // 是否有删除权限

const loading = ref(false); // 树的加载中
const fileList = ref<AiSkillApi.SkillFile[]>([]); // 文件列表（平铺）
const treeData = ref<AiSkillApi.SkillFile[]>([]); // 树的数据
const expandedKeys = ref<number[]>([]); // 展开的节点
const selectedKeys = ref<number[]>([]); // 选中的节点
const selectedNode = ref<AiSkillApi.SkillFile>(); // 当前选中的节点

/** 是否为目录节点 */
function isDirectory(node: AiSkillApi.SkillFile) {
  return node.type === AiSkillFileTypeEnum.DIRECTORY;
}

/** 根据节点 key 查找文件 */
function findFile(key: any) {
  return fileList.value.find((item) => String(item.id) === String(key));
}

/** 加载文件树 */
async function loadTree() {
  loading.value = true;
  try {
    const list = await getSkillFileList(props.skillId);
    fileList.value = list;
    treeData.value = handleTree(list);
    // 默认展开全部目录
    expandedKeys.value = list
      .filter((item) => isDirectory(item))
      .map((item) => item.id);
    // 刷新选中节点：节点被删除时，取消选中
    const selectedId = selectedNode.value?.id;
    selectedNode.value = selectedId
      ? list.find((item) => item.id === selectedId)
      : undefined;
    selectedKeys.value = selectedNode.value ? [selectedNode.value.id] : [];
    emit('select', selectedNode.value);
  } finally {
    loading.value = false;
  }
}

/** 点击节点：再次点击同一节点时保持选中 */
function handleSelect(_keys: any[], info: any) {
  const node = findFile(info.node?.key);
  if (!node) {
    return;
  }
  selectedNode.value = node;
  selectedKeys.value = [node.id];
  emit('select', node);
}

// ==================== 拖拽移动 ====================

/** 是否允许放置：固定节点不可移动；拖入内部时，目标必须是目录 */
function allowDrop({ dragNode, dropNode, dropPosition }: any) {
  if (dragNode.locked) {
    return false;
  }
  return dropPosition !== 0 || isDirectory(dropNode);
}

/** 拖拽完成 */
async function handleDrop(info: any) {
  const dragging = findFile(info.dragNode?.key);
  const target = findFile(info.node?.key);
  if (!dragging || !target || dragging.locked) {
    return;
  }
  // 计算新的父目录：拖入内部为目标目录，否则与目标节点同级
  const parentId = info.dropToGap ? target.parentId : target.id;
  if (parentId === dragging.parentId) {
    return;
  }
  try {
    await moveSkillFile({ id: dragging.id, parentId });
    message.success('移动成功');
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
          message.warning('名称不能为空');
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
  message.success($t('ui.actionMessage.operationSuccess'));
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
  message.success($t('ui.actionMessage.operationSuccess'));
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
  message.success($t('ui.actionMessage.deleteSuccess', [node.name]));
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
          <Tooltip title="新建文件">
            <Button size="small" @click="handleCreate(false)">
              <IconifyIcon icon="lucide:file-plus" />
            </Button>
          </Tooltip>
          <Tooltip title="新建目录">
            <Button size="small" @click="handleCreate(true)">
              <IconifyIcon icon="lucide:folder-plus" />
            </Button>
          </Tooltip>
          <Tooltip title="重命名">
            <Button
              size="small"
              :disabled="!selectedNode || selectedNode.locked"
              @click="handleRename"
            >
              <IconifyIcon icon="lucide:pencil" />
            </Button>
          </Tooltip>
        </template>
        <Tooltip v-if="hasDeletePermission" title="删除">
          <Button
            size="small"
            danger
            :disabled="!selectedNode || selectedNode.locked"
            @click="handleDelete"
          >
            <IconifyIcon icon="lucide:trash-2" />
          </Button>
        </Tooltip>
      </div>
    </div>
    <!-- 文件树 -->
    <div
      v-loading="loading"
      class="relative min-h-0 flex-1 overflow-auto px-1.5 py-2"
    >
      <Tree
        v-model:expanded-keys="expandedKeys"
        :selected-keys="selectedKeys"
        :tree-data="treeData"
        :field-names="{ title: 'name', key: 'id', children: 'children' }"
        :draggable="hasUpdatePermission"
        :allow-drop="allowDrop"
        block-node
        @select="handleSelect"
        @drop="handleDrop"
      >
        <template #titleRender="dataRef">
          <span class="flex w-full items-center gap-1 overflow-hidden">
            <IconifyIcon
              class="flex-shrink-0"
              :icon="
                dataRef.type === AiSkillFileTypeEnum.DIRECTORY
                  ? 'lucide:folder'
                  : 'lucide:file'
              "
            />
            <span class="truncate">{{ dataRef.name }}</span>
            <Tooltip
              v-if="dataRef.locked"
              title="固定文件/目录不可删除、改名或移动"
            >
              <IconifyIcon
                icon="lucide:lock"
                class="ml-auto mr-2 flex-shrink-0 text-yellow-500"
              />
            </Tooltip>
          </span>
        </template>
      </Tree>
    </div>
  </div>
</template>
