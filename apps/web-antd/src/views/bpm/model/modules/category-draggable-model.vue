<script lang="ts" setup>
import type { BpmCategoryApi } from '#/api/bpm/category';
import type { BpmModelApi } from '#/api/bpm/model';

import { computed, ref, watchEffect } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
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
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { deleteCategory } from '#/api/bpm/category';
import { updateModelSortBatch } from '#/api/bpm/model';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import { DICT_TYPE } from '#/utils';

// 导入重命名表单
import CategoryRenameForm from '../../category/modules/rename-form.vue';

const props = defineProps<{
  categoryInfo: BpmCategoryApi.ModelCategoryInfo;
  isCategorySorting: boolean;
}>();

const emit = defineEmits(['success']);

const isModelSorting = ref(false);
const originalData = ref<BpmModelApi.ModelVO[]>([]);
const modelList = ref<BpmModelApi.ModelVO[]>([]);
const isExpand = ref(false);
const tableRef = ref();

// 排序引用，以便后续启用或禁用排序
const sortableInstance = ref<any>(null);
/** 解决 v-model 问题，使用计算属性 */
const expandKeys = computed(() => (isExpand.value ? ['1'] : []));

// 表格列配置
const columns = [
  {
    title: '流程名',
    dataIndex: 'name',
    key: 'name',
    align: 'left' as const,
    minWidth: 250,
  },
  {
    title: '可见范围',
    dataIndex: 'startUserIds',
    key: 'startUserIds',
    align: 'center' as const,
    minWidth: 150,
  },
  {
    title: '流程类型',
    dataIndex: 'type',
    key: 'type',
    align: 'center' as const,
    minWidth: 120,
  },
  {
    title: '表单信息',
    dataIndex: 'formType',
    key: 'formType',
    align: 'center' as const,
    minWidth: 150,
  },
  {
    title: '最后发布',
    dataIndex: 'deploymentTime',
    key: 'deploymentTime',
    align: 'center' as const,
    minWidth: 250,
  },
  {
    title: '操作',
    key: 'operation',
    align: 'center' as const,
    fixed: 'right' as const,
    width: 150,
  },
];

/** 处理模型的排序 */
const handleModelSort = () => {
  // 保存初始数据
  originalData.value = cloneDeep(props.categoryInfo.modelList);
  // 展开数据
  isExpand.value = true;
  isModelSorting.value = true;
  // 如果排序实例不存在，则初始化
  if (sortableInstance.value) {
    // 已存在实例，则启用排序功能
    sortableInstance.value.option('disabled', false);
  } else {
    const sortableClass = `.category-${props.categoryInfo.id} .ant-table .ant-table-tbody`;
    sortableInstance.value = useSortable(sortableClass, modelList, {
      disabled: false, // 启用排序
    });
  }
};

/** 处理模型的排序提交 */
const handleModelSortSubmit = async () => {
  try {
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
};

/** 处理模型的排序取消 */
const handleModelSortCancel = () => {
  // 恢复初始数据
  modelList.value = cloneDeep(originalData.value);
  isModelSorting.value = false;
  // 禁用排序功能
  if (sortableInstance.value) {
    sortableInstance.value.option('disabled', true);
  }
};

/** 处理下拉菜单命令 */
const handleCommand = (command: string) => {
  if (command === 'renameCategory') {
    // 打开重命名分类对话框
    categoryRenameModalApi.setData(props.categoryInfo).open();
  } else if (command === 'deleteCategory') {
    handleDeleteCategory();
  }
};

/** 删除流程分类 */
const handleDeleteCategory = async () => {
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
};

/** 处理表单详情点击 */
const handleFormDetail = (row: any) => {
  // TODO 待实现
  console.warn('待实现', row);
};

/** 更新 modelList 模型列表 */
const updateModelList = useDebounceFn(() => {
  const newModelList = props.categoryInfo.modelList;
  if (!isEqual(modelList.value, newModelList)) {
    modelList.value = cloneDeep(newModelList);
    if (newModelList?.length > 0) {
      isExpand.value = true;
    }
    // 关闭排序
    isModelSorting.value = false;
    // 重置排序实例
    sortableInstance.value = null;
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

/** 自定义表格行渲染 */
const customRow = (_record: any) => {
  return {
    class: isModelSorting.value ? 'cursor-move' : '',
  };
};

// 重命名分类对话框
const [CategoryRenameModal, categoryRenameModalApi] = useVbenModal({
  connectedComponent: CategoryRenameForm,
  destroyOnClose: true,
});

// 处理重命名成功
const handleRenameSuccess = () => {
  emit('success');
};
</script>

<template>
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
        <div class="ml-4 mr-2 text-lg font-medium">{{ categoryInfo.name }}</div>
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
          <span
            class="icon-[ic--round-expand-more] text-3xl text-gray-400"
          ></span>
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
              class="flex items-center text-[14px]"
              @click.stop="handleModelSort"
            >
              <template #icon>
                <span class="icon-[fa--sort-amount-desc]"></span>
              </template>
              排序
            </Button>
            <Dropdown placement="bottom" arrow>
              <Button
                type="link"
                size="small"
                class="flex items-center text-[14px]"
              >
                <template #icon>
                  <span class="icon-[ant-design--setting-outlined]"></span>
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
    <Collapse :active-key="expandKeys" :bordered="false" class="bg-transparent">
      <Collapse.Panel
        key="1"
        :show-arrow="false"
        class="border-0 bg-transparent p-0"
        v-show="isExpand"
      >
        <Table
          v-if="modelList && modelList.length > 0"
          :class="`category-${categoryInfo.id}`"
          ref="tableRef"
          :data-source="modelList"
          :columns="columns"
          :pagination="false"
          :custom-row="customRow"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <!-- 流程名 -->
            <template v-if="column.key === 'name'">
              <div class="flex items-center">
                <Tooltip v-if="isModelSorting" title="拖动排序">
                  <span
                    class="icon-[ic--round-drag-indicator] mr-2.5 cursor-move text-2xl text-gray-500"
                  ></span>
                </Tooltip>
                <div
                  v-if="!record.icon"
                  class="mr-2.5 flex h-9 w-9 items-center justify-center rounded bg-blue-500 text-white"
                >
                  <span style="font-size: 12px">{{
                    record.name.substring(0, 2)
                  }}</span>
                </div>
                <img
                  v-else
                  :src="record.icon"
                  class="mr-2.5 h-9 w-9 rounded"
                  alt="图标"
                />
                {{ record.name }}
              </div>
            </template>

            <!-- 可见范围列-->
            <template v-else-if="column.key === 'startUserIds'">
              <span
                v-if="!record.startUsers?.length && !record.startDepts?.length"
              >
                全部可见
              </span>
              <span v-else-if="record.startUsers?.length === 1">
                {{ record.startUsers[0].nickname }}
              </span>
              <span v-else-if="record.startDepts?.length === 1">
                {{ record.startDepts[0].name }}
              </span>
              <span v-else-if="record.startDepts?.length > 1">
                <Tooltip
                  placement="top"
                  :title="
                    record.startDepts.map((dept: any) => dept.name).join('、')
                  "
                >
                  {{ record.startDepts[0].name }}等
                  {{ record.startDepts.length }} 个部门可见
                </Tooltip>
              </span>
              <span v-else-if="record.startUsers?.length > 1">
                <Tooltip
                  placement="top"
                  :title="
                    record.startUsers
                      .map((user: any) => user.nickname)
                      .join('、')
                  "
                >
                  {{ record.startUsers[0].nickname }}等
                  {{ record.startUsers.length }} 人可见
                </Tooltip>
              </span>
            </template>
            <!-- 流程类型列 -->
            <template v-else-if="column.key === 'type'">
              <!-- <DictTag :value="record.type" :type="DICT_TYPE.BPM_MODEL_TYPE" /> -->
              <!-- <Tag>{{ record.type }}</Tag> -->
              <DictTag :type="DICT_TYPE.BPM_MODEL_TYPE" :value="record.type" />
            </template>
            <!-- 表单信息列 -->
            <template v-else-if="column.key === 'formType'">
              <!-- TODO BpmModelFormType.NORMAL -->
              <Button
                v-if="record.formType === 10"
                type="link"
                @click="handleFormDetail(record)"
              >
                {{ record.formName }}
              </Button>
              <!-- TODO BpmModelFormType.CUSTOM -->
              <Button
                v-else-if="record.formType === 20"
                type="link"
                @click="handleFormDetail(record)"
              >
                {{ record.formCustomCreatePath }}
              </Button>
              <span v-else>暂无表单</span>
            </template>
            <!-- 最后发布列 -->
            <template v-else-if="column.key === 'deploymentTime'">
              <div class="flex items-center justify-center">
                <span v-if="record.processDefinition" class="w-[150px]">
                  {{ formatDateTime(record.processDefinition.deploymentTime) }}
                </span>
                <Tag v-if="record.processDefinition">
                  v{{ record.processDefinition.version }}
                </Tag>
                <Tag v-else color="warning">未部署</Tag>
                <Tag
                  v-if="record.processDefinition?.suspensionState === 2"
                  color="warning"
                  class="ml-[10px]"
                >
                  已停用
                </Tag>
              </div>
            </template>
            <!-- 操作列 -->
            <template v-else-if="column.key === 'operation'">
              <div class="flex items-center justify-center">待实现</div>
            </template>
          </template>
        </Table>
      </Collapse.Panel>
    </Collapse>
  </Card>

  <!-- 重命名分类弹窗 -->
  <CategoryRenameModal @success="handleRenameSuccess" />
</template>

<style lang="scss" scoped>
.category-draggable-model {
  // ant-table-tbody 自定义样式
  :deep(.ant-table-tbody > tr > td) {
    overflow: hidden;
    border-bottom: none;
  }
  // ant-collapse-header 自定义样式
  :deep(.ant-collapse-header) {
    padding: 0;
  }

  // 优化表格渲染性能
  :deep(.ant-table-tbody) {
    transform: translateZ(0);
    will-change: transform;
  }

  // 折叠面板样式
  :deep(.ant-collapse-content-box) {
    padding: 0;
  }
}
</style>
