<script lang="ts" setup>
import type { ModelCategoryInfo } from '#/api/bpm/model';

import { onActivated, reactive, ref, useTemplateRef, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { cloneDeep } from '@vben/utils';

import { useSortable } from '@vueuse/integrations/useSortable';
import {
  Alert,
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  Menu,
  message,
  Upload,
} from 'ant-design-vue';

import {
  getCategorySimpleList,
  updateCategorySortBatch,
} from '#/api/bpm/category';
import { getModelList, importModel as importModelApi } from '#/api/bpm/model';
import { router } from '#/router';

import CategoryForm from '../category/modules/form.vue';
import CategoryDraggableModel from './modules/category-draggable-model.vue';

const [CategoryFormModal, categoryFormModalApi] = useVbenModal({
  connectedComponent: CategoryForm,
  destroyOnClose: true,
});

const modelListSpinning = ref(false); // 模型列表加载状态

const saveSortLoading = ref(false); // 保存排序状态
const categoryGroup = ref<ModelCategoryInfo[]>([]); // 按照 category 分组的数据
const originalData = ref<ModelCategoryInfo[]>([]); // 未排序前的原始数据

const sortable = useTemplateRef<HTMLElement>('categoryGroupRef'); // 可以排序元素的容器
const sortableInstance = ref<any>(null); // 排序引用，以便后续启用或禁用排序
const isCategorySorting = ref(false); // 分类排序状态

// ========== 导入弹窗相关 ==========
const importFile = ref<File | null>(null); // 导入文件（用于最终提交）
const importFileList = ref<any[]>([]); // 上传组件的文件列表
const importFormRef = ref();
const importForm = reactive({
  key: '',
  name: '',
});

const [ImportModal, importModalApi] = useVbenModal({
  async onConfirm() {
    if (!importFile.value) {
      message.warning('请上传流程模型文件');
      return;
    }
    await importFormRef.value?.validate();
    importModalApi.lock();
    try {
      await importModelApi(importFile.value, importForm.key, importForm.name);
      message.success('导入成功');
      await importModalApi.close();
      await getList();
    } catch {
      // 全局 request 拦截器已处理错误提示
    } finally {
      importModalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      importFile.value = null;
      importFileList.value = [];
      importForm.key = '';
      importForm.name = '';
    }
  },
});

/** 上传前校验 + 读取文件自动填充字段 */
function beforeUpload(file: File) {
  const isJson =
    file.type === 'application/json' || file.name.endsWith('.json');
  if (!isJson) {
    message.error('仅支持上传 JSON 格式的流程模型文件');
    return Upload.LIST_IGNORE;
  }
  importFile.value = file;
  file.text().then((text) => {
    try {
      const json = JSON.parse(text);
      importForm.key = json.key || '';
      importForm.name = json.name || '';
    } catch {
      message.error('JSON 文件格式不正确');
    }
  });
  return false; // 阻止默认上传，不显示上传动画
}

/** 点击导入按钮 */
function handleImportClick() {
  importModalApi.open();
}

const queryParams = reactive({
  name: '',
}); // 查询参数

/** 监听分类排序模式切换 */
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
async function getList() {
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
}

/** 初始化 */
onActivated(() => {
  getList();
});

/** 新增模型 */
function createModel() {
  router.push({
    name: 'BpmModelCreate',
  });
}

/** 处理下拉菜单命令 */
function handleCommand(command: string) {
  if (command === 'handleCategoryAdd') {
    // 打开新建流程分类弹窗
    categoryFormModalApi.open();
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
}

/** 取消分类排序 */
function handleCategorySortCancel() {
  // 恢复初始数据
  categoryGroup.value = cloneDeep(originalData.value);
  isCategorySorting.value = false;
  // 直接禁用排序功能
  if (sortableInstance.value) {
    sortableInstance.value.option('disabled', true);
  }
}

/** 提交分类排序 */
async function handleCategorySortSubmit() {
  saveSortLoading.value = true;
  try {
    // 保存排序逻辑
    const ids = categoryGroup.value.map((item: any) => item.id);
    await updateCategorySortBatch(ids);
    message.success('分类排序成功');
  } finally {
    saveSortLoading.value = false;
  }
  isCategorySorting.value = false;
  // 刷新列表
  await getList();
  // 禁用排序功能
  if (sortableInstance.value) {
    sortableInstance.value.option('disabled', true);
  }
}
</script>

<template>
  <Page auto-content-height>
    <!-- 流程分类表单弹窗 -->
    <CategoryFormModal @success="getList" />
    <Card
      :body-style="{ padding: '10px' }"
      class="mb-4"
      title="流程模型"
      v-spinning="modelListSpinning"
    >
      <template #extra>
        <div v-if="!isCategorySorting">
          <Input
            v-model:value="queryParams.name"
            placeholder="搜索流程"
            allow-clear
            @press-enter="getList"
            class="!w-60"
          />
          <Button class="ml-2" type="primary" @click="createModel">
            <IconifyIcon icon="lucide:plus" /> 新建模型
          </Button>
          <Button class="ml-2" @click="handleImportClick">
            <IconifyIcon icon="lucide:upload" /> 导入模型
          </Button>
          <Dropdown class="ml-2" placement="bottomRight" arrow>
            <Button>
              <template #icon>
                <div class="flex items-center justify-center">
                  <IconifyIcon icon="lucide:settings" />
                </div>
              </template>
            </Button>
            <template #overlay>
              <Menu @click="(e) => handleCommand(e.key as string)">
                <Menu.Item key="handleCategoryAdd">
                  <div class="flex items-center gap-1">
                    <IconifyIcon icon="lucide:plus" />
                    新建分类
                  </div>
                </Menu.Item>
                <Menu.Item key="handleCategorySort">
                  <div class="flex items-center gap-1">
                    <IconifyIcon icon="lucide:align-start-vertical" />
                    分类排序
                  </div>
                </Menu.Item>
              </Menu>
            </template>
          </Dropdown>
        </div>
        <div class="flex h-full items-center justify-between" v-else>
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
      </template>

      <!-- 按照分类，展示其所属的模型列表 -->
      <div class="px-3" ref="categoryGroupRef">
        <CategoryDraggableModel
          v-for="(element, index) in categoryGroup"
          :class="isCategorySorting ? 'cursor-move' : ''"
          :key="element.id"
          :category-info="element"
          :is-category-sorting="isCategorySorting"
          :is-first="index === 0"
          @success="getList"
        />
      </div>
    </Card>

    <!-- 导入流程模型弹窗 -->
    <ImportModal title="导入流程模型" class="w-[640px]">
      <div class="mx-4 my-2">
        <Alert
          message="跨租户导入说明"
          description="导入文件由【导出】功能生成。导入后将在当前租户下新建流程模型，审批人、可发起人、流程管理员等数据无法跨租户复用，仅保留审批节点结构，请在导入后重新配置审批人再发布。"
          type="info"
          show-icon
          class="!mb-4"
        />
        <Form ref="importFormRef" :model="importForm">
          <!-- 1. 流程模型文件 -->
          <Form.Item label="流程模型文件" name="file">
            <Upload.Dragger
              v-model:file-list="importFileList"
              :before-upload="beforeUpload"
              :max-count="1"
              accept=".json"
              :show-upload-list="{ showRemoveIcon: true }"
            >
              <p class="ant-upload-drag-icon flex justify-center">
                <IconifyIcon icon="lucide:cloud-upload" class="text-3xl" />
              </p>
              <p class="ant-upload-text">点击或拖拽文件到此处上传</p>
              <p class="ant-upload-hint">
                仅支持上传单个 JSON 格式的流程模型文件
              </p>
            </Upload.Dragger>
          </Form.Item>

          <!-- 2. 流程标识 -->
          <Form.Item
            label="流程标识"
            name="key"
            :rules="[{ required: true, message: '请输入流程标识' }]"
          >
            <Input
              v-model:value="importForm.key"
              placeholder="请输入流程标识"
            />
            <div class="text-xs text-gray-400">
              同租户导入时，若标识已存在请修改后再导入
            </div>
          </Form.Item>

          <!-- 3. 流程名称 -->
          <Form.Item
            label="流程名称"
            name="name"
            :rules="[{ required: true, message: '请输入流程名称' }]"
          >
            <Input
              v-model:value="importForm.name"
              placeholder="请输入流程名称"
            />
            <div class="text-xs text-gray-400">必填，请填写流程名称</div>
          </Form.Item>
        </Form>
      </div>
    </ImportModal>
  </Page>
</template>
