<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BpmModelApi, ModelCategoryInfo } from '#/api/bpm/model';

import { computed, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, EllipsisText, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { cloneDeep, formatDateTime, isEqual } from '@vben/utils';

import { useDebounceFn } from '@vueuse/core';
import { useSortable } from '@vueuse/integrations/useSortable';
import {
  Button,
  Card,
  Collapse,
  Dropdown,
  Menu,
  message,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteCategory } from '#/api/bpm/category';
import {
  cleanModel,
  deleteModel,
  deployModel,
  updateModelSortBatch,
  updateModelState,
} from '#/api/bpm/model';
import { $t } from '#/locales';
import { BpmModelFormType } from '#/utils';

// 导入重命名表单
import CategoryRenameForm from '../../category/modules/rename-form.vue';
// 导入 FormCreate 表单详情
import FormCreateDetail from '../../form/modules/detail.vue';
import { useGridColumns } from './data';

const props = defineProps<{
  categoryInfo: ModelCategoryInfo;
  isCategorySorting: boolean;
  isFirst?: boolean; // 是否为第一个分类
}>();

const emit = defineEmits(['success']);

/** 重命名分类对话框 */
const [CategoryRenameModal, categoryRenameModalApi] = useVbenModal({
  connectedComponent: CategoryRenameForm,
  destroyOnClose: true,
});

/** 流程表单详情对话框 */
const [FormCreateDetailModal, formCreateDetailModalApi] = useVbenModal({
  connectedComponent: FormCreateDetail,
  destroyOnClose: true,
});

const router = useRouter();
// 获取当前登录用户Id
const userStore = useUserStore();
const userId = userStore.userInfo?.id;
const isModelSorting = ref(false);
const originalData = ref<BpmModelApi.Model[]>([]);
const modelList = ref<BpmModelApi.Model[]>([]);
// 根据是否为第一个分类, 来设置初始展开状态
const isExpand = ref(!!props.isFirst);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    pagerConfig: {
      enabled: false,
    },
    data: modelList.value,
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      enabled: false, // 完全禁用工具栏
    },
  } as VxeTableGridOptions,
});

// 排序引用，以便后续启用或禁用排序
const sortableInstance = ref<any>(null);
/** 解决 v-model 问题，使用计算属性 */
const expandKeys = computed(() => (isExpand.value ? ['1'] : []));

const { hasAccessByCodes } = useAccess();
/** 权限校验：通过 computed 解决列表的卡顿问题 */
const hasPermiUpdate = computed(() => {
  return hasAccessByCodes(['bpm:model:update']);
});
const hasPermiDelete = computed(() => {
  return hasAccessByCodes(['bpm:model:delete']);
});
const hasPermiDeploy = computed(() => {
  return hasAccessByCodes(['bpm:model:deploy']);
});

/** 处理模型的排序 */
function handleModelSort() {
  // 保存初始数据并确保数据完整
  if (props.categoryInfo.modelList && props.categoryInfo.modelList.length > 0) {
    originalData.value = cloneDeep(props.categoryInfo.modelList);
    modelList.value = cloneDeep(props.categoryInfo.modelList);
  }

  // 更新表格数据
  gridApi.setGridOptions({
    data: modelList.value,
  });

  // 展开数据
  isExpand.value = true;
  isModelSorting.value = true;
  // 如果排序实例不存在，则初始化
  if (sortableInstance.value) {
    // 已存在实例，则启用排序功能
    sortableInstance.value.option('disabled', false);
  } else {
    const sortableClass = `.category-${props.categoryInfo.id} .vxe-table .vxe-table--body-wrapper:not(.fixed-right--wrapper) .vxe-table--body tbody`;
    // 确保使用最新的数据
    modelList.value = cloneDeep(props.categoryInfo.modelList);
    // 更新表格数据
    gridApi.setGridOptions({
      data: modelList.value,
    });

    sortableInstance.value = useSortable(sortableClass, modelList.value, {
      draggable: '.vxe-body--row',
      animation: 150,
      handle: '.drag-handle',
      disabled: false,
      onEnd: ({ newDraggableIndex, oldDraggableIndex }) => {
        if (oldDraggableIndex !== newDraggableIndex) {
          modelList.value.splice(
            newDraggableIndex ?? 0,
            0,
            modelList.value.splice(oldDraggableIndex ?? 0, 1)[0]!,
          );
        }
      },
    });
  }
}

/** 处理模型的排序提交 */
async function handleModelSortSubmit() {
  try {
    // 确保数据已经正确同步
    if (!modelList.value || modelList.value.length === 0) {
      message.error('排序数据异常，请重试');
      return;
    }
    // 保存排序
    const ids = modelList.value.map((item) => item.id);
    await updateModelSortBatch(ids);
    // 刷新列表
    isModelSorting.value = false;
    message.success('排序模型成功');
    emit('success');
  } catch (error) {
    console.error('排序保存失败', error);
  }
}

/** 处理模型的排序取消 */
function handleModelSortCancel() {
  // 恢复初始数据
  if (originalData.value && originalData.value.length > 0) {
    modelList.value = cloneDeep(originalData.value);
    // 更新表格数据
    gridApi.setGridOptions({
      data: modelList.value,
    });
  }
  // 禁用排序功能
  if (sortableInstance.value) {
    sortableInstance.value.option('disabled', true);
  }
  isModelSorting.value = false;
}

/** 处理下拉菜单命令 */
function handleCommand(command: string) {
  if (command === 'renameCategory') {
    // 打开重命名分类对话框
    categoryRenameModalApi.setData(props.categoryInfo).open();
  } else if (command === 'deleteCategory') {
    handleDeleteCategory();
  }
}

/** 删除流程分类 */
async function handleDeleteCategory() {
  if (props.categoryInfo.modelList.length > 0) {
    message.warning('该分类下仍有流程定义,不允许删除');
    return;
  }

  confirm({
    content: `确定要删除[${props.categoryInfo.name}]吗？`,
  }).then(async () => {
    // 发起删除
    await deleteCategory(props.categoryInfo.id);
    message.success(
      $t('ui.actionMessage.deleteSuccess', [props.categoryInfo.name]),
    );
    // 刷新列表
    emit('success');
  });
}

/** 处理表单详情点击 */
function handleFormDetail(row: any) {
  if (row.formType === BpmModelFormType.NORMAL) {
    const data = {
      id: row.formId,
    };
    formCreateDetailModalApi.setData(data).open();
  } else {
    // TODO 待实现
    console.warn('业务表单待实现', row);
  }
}

/** 判断是否是流程管理员 */
function isManagerUser(row: any) {
  return row.managerUserIds && row.managerUserIds.includes(userId);
}

async function modelOperation(type: string, id: number) {
  await router.push({
    name: 'BpmModelUpdate',
    params: { id, type },
  });
}

/** 发布流程 */
async function handleDeploy(row: any) {
  confirm({
    beforeClose: async ({ isConfirm }) => {
      if (!isConfirm) return;
      // 发起部署
      await deployModel(row.id);
      return true;
    },
    content: `确认要发布[${row.name}]流程吗？`,
    icon: 'question',
  }).then(async () => {
    message.success(`发布[${row.name}]流程成功`);
    // 刷新列表
    emit('success');
  });
}

/** '更多'操作按钮 */
function handleModelCommand(command: string, row: any) {
  switch (command) {
    case 'handleChangeState': {
      handleChangeState(row);
      break;
    }
    case 'handleClean': {
      handleClean(row);
      break;
    }
    case 'handleCopy': {
      modelOperation('copy', row.id);
      break;
    }
    case 'handleDefinitionList': {
      handleDefinitionList(row);
      break;
    }
    case 'handleDelete': {
      handleDelete(row);
      break;
    }
    case 'handleReport': {
      handleReport(row);
      break;
    }
    default: {
      break;
    }
  }
}

/** 更新状态操作 */
function handleChangeState(row: any) {
  const state = row.processDefinition.suspensionState;
  const newState = state === 1 ? 2 : 1;
  const statusState = state === 1 ? '停用' : '启用';
  confirm({
    beforeClose: async ({ isConfirm }) => {
      if (!isConfirm) return;
      // 发起更新状态
      await updateModelState(row.id, newState);
      return true;
    },
    content: `确认要${statusState}流程: "${row.name}" 吗？`,
    icon: 'question',
  }).then(async () => {
    message.success(`${statusState} 流程: "${row.name}" 成功`);
    // 刷新列表
    emit('success');
  });
}

/** 清理流程操作 */
function handleClean(row: any) {
  confirm({
    beforeClose: async ({ isConfirm }) => {
      if (!isConfirm) return;
      // 发起清理操作
      await cleanModel(row.id);
      return true;
    },
    content: `确认要清理流程: "${row.name}" 吗？`,
    icon: 'question',
  }).then(async () => {
    message.success(`清理流程: "${row.name}" 成功`);
    // 刷新列表
    emit('success');
  });
}

/** 删除流程操作 */
function handleDelete(row: any) {
  confirm({
    beforeClose: async ({ isConfirm }) => {
      if (!isConfirm) return;
      // 发起删除操作
      await deleteModel(row.id);
      return true;
    },
    content: `确认要删除流程: "${row.name}" 吗？`,
    icon: 'question',
  }).then(async () => {
    message.success(`删除流程: "${row.name}" 成功`);
    // 刷新列表
    emit('success');
  });
}

/** 跳转到指定流程定义列表 */
function handleDefinitionList(row: any) {
  router.push({
    name: 'BpmProcessDefinition',
    query: {
      key: row.key,
    },
  });
}

/** 跳转到流程报表页面 */
function handleReport(row: any) {
  router.push({
    name: 'BpmProcessInstanceReport',
    query: {
      processDefinitionId: row.processDefinition.id,
      processDefinitionKey: row.key,
    },
  });
}

/** 更新 modelList 模型列表 */
const updateModelList = useDebounceFn(() => {
  const newModelList = props.categoryInfo.modelList;
  if (!isEqual(modelList.value, newModelList)) {
    modelList.value = cloneDeep(newModelList);
    // 不再自动设置展开状态，除非是第一个分类
    // 关闭排序
    isModelSorting.value = false;
    // 重置排序实例
    sortableInstance.value = null;
    // 更新表格数据
    gridApi.setGridOptions({
      data: modelList.value,
    });
  }
}, 100);

/** 监听分类信息和排序状态变化 */
watchEffect(() => {
  if (props.categoryInfo?.modelList) {
    updateModelList();
  }

  if (props.isCategorySorting) {
    isExpand.value = false;
  }
});

// 处理重命名成功
const handleRenameSuccess = () => {
  emit('success');
};
</script>

<template>
  <div>
    <Card
      :body-style="{ padding: 0 }"
      class="category-draggable-model mb-5 rounded-lg transition-all duration-300 ease-in-out hover:shadow-xl"
    >
      <div class="flex h-12 items-center">
        <!-- 头部：分类名 -->
        <div class="flex items-center">
          <Tooltip v-if="isCategorySorting" title="拖动排序">
            <span
              class="icon-[ic--round-drag-indicator] ml-2.5 cursor-move text-2xl text-gray-500"
            ></span>
          </Tooltip>
          <div class="ml-4 mr-2 text-lg font-medium">
            {{ categoryInfo.name }}
          </div>
          <div class="text-gray-500">
            ({{ categoryInfo.modelList?.length || 0 }})
          </div>
        </div>

        <!-- 头部：操作 -->
        <div class="flex flex-1 items-center" v-show="!isCategorySorting">
          <div
            v-if="categoryInfo.modelList.length > 0"
            class="ml-3 flex cursor-pointer items-center transition-transform duration-300"
            :class="isExpand ? 'rotate-180' : 'rotate-0'"
            @click="isExpand = !isExpand"
          >
            <IconifyIcon
              icon="lucide:chevron-down"
              class="text-3xl text-gray-400"
            />
          </div>

          <div
            class="ml-auto flex items-center"
            :class="isModelSorting ? 'mr-4' : 'mr-8'"
          >
            <template v-if="!isModelSorting">
              <Button
                v-if="categoryInfo.modelList.length > 0"
                type="link"
                size="small"
                class="flex items-center text-sm"
                @click.stop="handleModelSort"
              >
                <template #icon>
                  <IconifyIcon icon="lucide:align-start-vertical" />
                </template>
                排序
              </Button>
              <Dropdown placement="bottom" arrow>
                <Button
                  type="link"
                  size="small"
                  class="flex items-center text-sm"
                >
                  <template #icon>
                    <IconifyIcon icon="lucide:settings" />
                  </template>
                  分类
                </Button>
                <template #overlay>
                  <Menu @click="(e) => handleCommand(e.key as string)">
                    <Menu.Item key="renameCategory"> 重命名 </Menu.Item>
                    <Menu.Item key="deleteCategory"> 删除分类 </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
            </template>

            <template v-else>
              <Button @click.stop="handleModelSortCancel" class="mr-2">
                取 消
              </Button>
              <Button type="primary" @click.stop="handleModelSortSubmit">
                保存排序
              </Button>
            </template>
          </div>
        </div>
      </div>

      <!-- 模型列表 -->
      <Collapse
        :active-key="expandKeys"
        :bordered="false"
        class="bg-transparent"
      >
        <Collapse.Panel
          key="1"
          :show-arrow="false"
          class="border-0 bg-transparent p-0"
          v-show="isExpand"
        >
          <Grid
            v-if="modelList && modelList.length > 0"
            :class="`category-${categoryInfo.id}`"
          >
            <template #name="{ row }">
              <div class="flex items-center">
                <Tooltip
                  v-if="isModelSorting"
                  title="拖动排序"
                  placement="left"
                >
                  <IconifyIcon
                    icon="ic:round-drag-indicator"
                    class="mr-2.5 cursor-move text-2xl text-gray-500"
                  />
                </Tooltip>
                <div
                  v-if="!row.icon"
                  class="mr-2.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-blue-500 text-white"
                >
                  <span class="text-xs">
                    {{ row.name.substring(0, 2) }}
                  </span>
                </div>
                <img
                  v-else
                  :src="row.icon"
                  class="mr-2.5 h-9 w-9 flex-shrink-0 rounded"
                  alt="图标"
                />
                <EllipsisText :max-width="160" :tooltip-when-ellipsis="true">
                  {{ row.name }}
                </EllipsisText>
              </div>
            </template>
            <template #startUserIds="{ row }">
              <span v-if="!row.startUsers?.length && !row.startDepts?.length">
                全部可见
              </span>
              <span v-else-if="row.startUsers?.length === 1">
                {{ row.startUsers[0].nickname }}
              </span>
              <span v-else-if="row.startDepts?.length === 1">
                {{ row.startDepts[0].name }}
              </span>
              <span v-else-if="row.startDepts?.length > 1">
                <Tooltip
                  placement="top"
                  :title="
                    row.startDepts.map((dept: any) => dept.name).join('、')
                  "
                >
                  {{ row.startDepts[0].name }}等
                  {{ row.startDepts.length }} 个部门可见
                </Tooltip>
              </span>
              <span v-else-if="row.startUsers?.length > 1">
                <Tooltip
                  placement="top"
                  :title="
                    row.startUsers.map((user: any) => user.nickname).join('、')
                  "
                >
                  {{ row.startUsers[0].nickname }}等
                  {{ row.startUsers.length }} 人可见
                </Tooltip>
              </span>
            </template>
            <template #formInfo="{ row }">
              <Button
                v-if="row.formType === BpmModelFormType.NORMAL"
                type="link"
                @click="handleFormDetail(row)"
              >
                {{ row.formName }}
              </Button>
              <Button
                v-else-if="row.formType === BpmModelFormType.CUSTOM"
                type="link"
                @click="handleFormDetail(row)"
              >
                {{ row.formCustomCreatePath }}
              </Button>
              <span v-else>暂无表单</span>
            </template>
            <template #deploymentTime="{ row }">
              <div class="flex items-center justify-center">
                <span v-if="row.processDefinition" class="w-36">
                  {{ formatDateTime(row.processDefinition.deploymentTime) }}
                </span>
                <Tag v-if="row.processDefinition">
                  v{{ row.processDefinition.version }}
                </Tag>
                <Tag v-else color="warning">未部署</Tag>
                <Tag
                  v-if="row.processDefinition?.suspensionState === 2"
                  color="warning"
                  class="ml-2.5"
                >
                  已停用
                </Tag>
              </div>
            </template>
            <template #actions="{ row }">
              <div class="flex items-center space-x-0">
                <Button
                  type="link"
                  size="small"
                  class="px-1"
                  @click="modelOperation('update', row.id)"
                  :disabled="!isManagerUser(row) || !hasPermiUpdate"
                >
                  修改
                </Button>
                <Button
                  type="link"
                  size="small"
                  class="px-1"
                  @click="handleDeploy(row)"
                  :disabled="!isManagerUser(row) || !hasPermiDeploy"
                >
                  发布
                </Button>
                <Dropdown placement="bottomRight" arrow>
                  <Button type="link" size="small" class="px-1">更多</Button>
                  <template #overlay>
                    <Menu
                      @click="(e) => handleModelCommand(e.key as string, row)"
                    >
                      <Menu.Item key="handleCopy"> 复制 </Menu.Item>
                      <Menu.Item key="handleDefinitionList"> 历史 </Menu.Item>

                      <Menu.Item
                        key="handleReport"
                        :disabled="!isManagerUser(row)"
                      >
                        报表
                      </Menu.Item>
                      <Menu.Item
                        key="handleChangeState"
                        v-if="row.processDefinition"
                        :disabled="!isManagerUser(row)"
                      >
                        {{
                          row.processDefinition.suspensionState === 1
                            ? '停用'
                            : '启用'
                        }}
                      </Menu.Item>
                      <Menu.Item
                        danger
                        key="handleClean"
                        :disabled="!isManagerUser(row)"
                      >
                        清理
                      </Menu.Item>
                      <Menu.Item
                        danger
                        key="handleDelete"
                        :disabled="!isManagerUser(row) || !hasPermiDelete"
                      >
                        删除
                      </Menu.Item>
                    </Menu>
                  </template>
                </Dropdown>
              </div>
            </template>
          </Grid>
        </Collapse.Panel>
      </Collapse>
    </Card>

    <!-- 重命名分类弹窗 -->
    <CategoryRenameModal @success="handleRenameSuccess" />
    <!-- 流程表单详情对话框 -->
    <FormCreateDetailModal />
  </div>
</template>

<style lang="scss" scoped>
.category-draggable-model {
  // ant-collapse-header 自定义样式
  :deep(.ant-collapse-header) {
    padding: 0;
  }

  // 折叠面板样式
  :deep(.ant-collapse-content-box) {
    padding: 0;
  }
}
</style>
