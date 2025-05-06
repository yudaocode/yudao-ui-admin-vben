<script lang="ts" setup>
import type { BpmModelApi } from '#/api/bpm/model';

import { onActivated, reactive, ref, useTemplateRef, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { Plus, Search, Settings } from '@vben/icons';
import { cloneDeep } from '@vben/utils';

import { refAutoReset } from '@vueuse/core';
import { useSortable } from '@vueuse/integrations/useSortable';
import {
  Button,
  Card,
  Divider,
  Dropdown,
  Form,
  Input,
  Menu,
  message,
} from 'ant-design-vue';

import {
  getCategorySimpleList,
  updateCategorySortBatch,
} from '#/api/bpm/category';
import { getModelList } from '#/api/bpm/model';

import CategoryDraggableModel from './modules/category-draggable-model.vue';
// 模型列表加载状态
const modelListSpinning = refAutoReset(false, 3000);
// 保存排序状态
const saveSortLoading = ref(false);
// 按照 category 分组的数据
const categoryGroup = ref<BpmModelApi.ModelCategoryInfo[]>([]);
// 未排序前的原始数据
const originalData = ref<BpmModelApi.ModelCategoryInfo[]>([]);
// 可以排序元素的容器
const sortable = useTemplateRef<HTMLElement>('categoryGroupRef');
// 排序引用，以便后续启用或禁用排序
const sortableInstance = ref<any>(null);
// 分类排序状态
const isCategorySorting = ref(false);
// 查询参数
const queryParams = reactive({
  name: '',
});

// 监听分类排序模式切换
watch(
  () => isCategorySorting.value,
  (newValue) => {
    if (sortableInstance.value) {
      if (newValue) {
        // 启用排序功能
        sortableInstance.value.option('disabled', false);
      } else {
        // 禁用排序功能
        sortableInstance.value.option('disabled', true);
      }
    }
  },
);

/** 加载数据 */
const getList = async () => {
  modelListSpinning.value = true;
  try {
    const modelList = await getModelList(queryParams.name);
    const categoryList = await getCategorySimpleList();
    // 按照 category 聚合
    categoryGroup.value = categoryList.map((category: any) => ({
      ...category,
      modelList: modelList.filter(
        (model: any) => model.categoryName === category.name,
      ),
    }));
    // 重置排序实例
    sortableInstance.value = null;
  } finally {
    modelListSpinning.value = false;
  }
};

/** 初始化 */
onActivated(() => {
  getList();
});

/** 查询方法 */
const handleQuery = () => {
  getList();
};

/** 新增模型 */
const createModel = () => {
  // TODO 新增模型
};

/** 处理下拉菜单命令 */
const handleCommand = (command: string) => {
  if (command === 'handleCategoryAdd') {
    //  TODO 新建分类逻辑
  } else if (command === 'handleCategorySort') {
    originalData.value = cloneDeep(categoryGroup.value);
    isCategorySorting.value = true;
    // 如果排序实例不存在，则初始化
    if (sortableInstance.value) {
      // 已存在实例，则启用排序功能
      sortableInstance.value.option('disabled', false);
    } else {
      sortableInstance.value = useSortable(sortable, categoryGroup, {
        disabled: false, // 启用排序
      });
    }
  }
};

/** 取消分类排序 */
const handleCategorySortCancel = () => {
  // 恢复初始数据
  categoryGroup.value = cloneDeep(originalData.value);
  isCategorySorting.value = false;
  // 直接禁用排序功能
  if (sortableInstance.value) {
    sortableInstance.value.option('disabled', true);
  }
};

/** 提交分类排序 */
const handleCategorySortSubmit = async () => {
  saveSortLoading.value = true;
  try {
    // 保存排序逻辑
    const ids = categoryGroup.value.map((item: any) => item.id);
    await updateCategorySortBatch(ids);
  } finally {
    saveSortLoading.value = false;
  }
  message.success('分类排序成功');
  isCategorySorting.value = false;
  // 刷新列表
  await getList();
  // 禁用排序功能
  if (sortableInstance.value) {
    sortableInstance.value.option('disabled', true);
  }
};
</script>

<template>
  <Page auto-content-height>
    <Card
      :body-style="{ padding: '10px' }"
      class="mb-4 h-[89vh]"
      v-spinning="modelListSpinning"
    >
      <div class="flex h-full items-center justify-between pl-5">
        <span class="-mb-4 text-lg font-extrabold">流程模型</span>
        <!-- 搜索工作栏 -->
        <Form
          v-if="!isCategorySorting"
          class="-mb-4 mr-2.5 flex"
          :model="queryParams"
          layout="inline"
        >
          <Form.Item name="name" class="ml-auto">
            <Input
              v-model:value="queryParams.name"
              placeholder="搜索流程"
              allow-clear
              @press-enter="handleQuery"
              class="!w-60"
            >
              <template #prefix>
                <Search class="mx-2.5" />
              </template>
            </Input>
          </Form.Item>
          <!-- 右上角：新建模型、更多操作 -->
          <Form.Item>
            <Button type="primary" @click="createModel">
              <Plus class="size-5" /> 新建模型
            </Button>
          </Form.Item>
          <Form.Item>
            <Dropdown placement="bottomRight">
              <Button>
                <template #icon>
                  <Settings class="size-4" />
                </template>
              </Button>
              <template #overlay>
                <Menu @click="(e) => handleCommand(e.key as string)">
                  <Menu.Item key="handleCategoryAdd">
                    <div class="flex items-center">
                      <span
                        class="icon-[ant-design--plus-outlined] mr-1.5 text-[18px]"
                      ></span>
                      新建分类
                    </div>
                  </Menu.Item>
                  <Menu.Item key="handleCategorySort">
                    <div class="flex items-center">
                      <span class="icon-[fa--sort-amount-desc] mr-1.5"></span>
                      分类排序
                    </div>
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
          </Form.Item>
        </Form>
        <div class="-mb-4 mr-6" v-else>
          <Button @click="handleCategorySortCancel" class="mr-3">
            取 消
          </Button>
          <Button
            type="primary"
            :loading="saveSortLoading"
            @click="handleCategorySortSubmit"
          >
            保存排序
          </Button>
        </div>
      </div>

      <Divider />
      <!-- 按照分类，展示其所属的模型列表 -->
      <div class="px-5" ref="categoryGroupRef">
        <CategoryDraggableModel
          v-for="element in categoryGroup"
          :class="isCategorySorting ? 'cursor-move' : ''"
          :key="element.id"
          :category-info="element"
          :is-category-sorting="isCategorySorting"
          @success="getList"
        />
      </div>
    </Card>
  </Page>
</template>
