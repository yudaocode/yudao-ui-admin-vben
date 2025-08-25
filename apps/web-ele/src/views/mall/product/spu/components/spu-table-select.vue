<script lang="ts" setup>
import type { MallCategoryApi } from '#/api/mall/product/category';
import type { MallSpuApi } from '#/api/mall/product/spu';

import { onMounted, ref } from 'vue';

import { handleTree } from '@vben/utils';

import {
  CHANGE_EVENT,
  ElButton,
  ElCheckbox,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElImage,
  ElInput,
  ElRadio,
  ElTable,
  ElTableColumn,
  ElTreeSelect,
} from 'element-plus';

import * as ProductCategoryApi from '#/api/mall/product/category';
import * as ProductSpuApi from '#/api/mall/product/spu';

/**
 * 商品表格选择对话框
 * 1. 单选模式：
 *    1.1 点击表格左侧的单选框时，结束选择，并关闭对话框
 *    1.2 再次打开时，保持选中状态
 * 2. 多选模式：
 *    2.1 点击表格左侧的多选框时，记录选中的商品
 *    2.2 切换分页时，保持商品的选中的状态
 *    2.3 点击右下角的确定按钮时，结束选择，关闭对话框
 *    2.4 再次打开时，保持选中状态
 */
defineOptions({ name: 'SpuTableSelect' });

defineProps({
  // 多选模式
  multiple: {
    type: Boolean,
    default: false,
  },
});

/** 确认选择时的触发事件 */
const emits = defineEmits<{
  change: [spu: any | MallSpuApi.Spu | MallSpuApi.Spu[]];
}>();
// 列表的总页数
const total = ref(0);
// 列表的数据
const list = ref<MallSpuApi.Spu[]>([]);
// 列表的加载中
const loading = ref(false);
// 弹窗的是否展示
const dialogVisible = ref(false);
// 查询参数
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  // 默认获取上架的商品
  tabType: 0,
  name: '',
  categoryId: null,
  createTime: [],
});

/** 打开弹窗 */
const open = (spuList?: MallSpuApi.Spu[]) => {
  // 重置
  checkedSpus.value = [];
  checkedStatus.value = {};
  isCheckAll.value = false;
  isIndeterminate.value = false;

  // 处理已选中
  if (spuList && spuList.length > 0) {
    checkedSpus.value = [...spuList];
    checkedStatus.value = Object.fromEntries(
      spuList.map((spu) => [spu.id, true]),
    );
  }

  dialogVisible.value = true;
  resetQuery();
};
// 提供 open 方法，用于打开弹窗
defineExpose({ open });

/** 查询列表 */
const getList = async () => {
  loading.value = true;
  try {
    const data = await ProductSpuApi.getSpuPage(queryParams.value);
    list.value = data.list;
    total.value = data.total;
    // checkbox绑定undefined会有问题，需要给一个bool值
    list.value.forEach(
      (spu) =>
        (checkedStatus.value[spu.id || 0] =
          checkedStatus.value[spu.id || 0] || false),
    );
    // 计算全选框状态
    calculateIsCheckAll();
  } finally {
    loading.value = false;
  }
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNo = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryParams.value = {
    pageNo: 1,
    pageSize: 10,
    // 默认获取上架的商品
    tabType: 0,
    name: '',
    categoryId: null,
    createTime: [],
  };
  getList();
};

// 是否全选
const isCheckAll = ref(false);
// 全选框是否处于中间状态：不是全部选中 && 任意一个选中
const isIndeterminate = ref(false);
// 选中的商品
const checkedSpus = ref<MallSpuApi.Spu[]>([]);
// 选中状态：key为商品ID，value为是否选中
const checkedStatus = ref<Record<string, boolean>>({});

// 选中的商品 spuId
const selectedSpuId = ref();
/** 单选中时触发 */
const handleSingleSelected = (spu: MallSpuApi.Spu) => {
  emits(CHANGE_EVENT, spu);
  // 关闭弹窗
  dialogVisible.value = false;
  // 记住上次选择的ID
  selectedSpuId.value = spu.id;
};

/** 多选完成 */
const handleEmitChange = () => {
  // 关闭弹窗
  dialogVisible.value = false;
  emits(CHANGE_EVENT, [...checkedSpus.value]);
};

/** 全选/全不选 */
const handleCheckAll = (checked: boolean) => {
  isCheckAll.value = checked;
  isIndeterminate.value = false;

  list.value.forEach((spu) => handleCheckOne(checked, spu, false));
};

/**
 * 选中一行
 * @param checked 是否选中
 * @param spu 商品
 * @param isCalcCheckAll 是否计算全选
 */
const handleCheckOne = (
  checked: boolean,
  spu: MallSpuApi.Spu,
  isCalcCheckAll: boolean,
) => {
  if (checked) {
    checkedSpus.value.push(spu);
    checkedStatus.value[spu.id || 0] = true;
  } else {
    const index = findCheckedIndex(spu);
    if (index > -1) {
      checkedSpus.value.splice(index, 1);
      checkedStatus.value[spu.id || 0] = false;
      isCheckAll.value = false;
    }
  }

  // 计算全选框状态
  if (isCalcCheckAll) {
    calculateIsCheckAll();
  }
};

// 查找商品在已选中商品列表中的索引
const findCheckedIndex = (spu: MallSpuApi.Spu) =>
  checkedSpus.value.findIndex((item) => item.id === spu.id);

// 计算全选框状态
const calculateIsCheckAll = () => {
  isCheckAll.value = list.value.every(
    (spu) => checkedStatus.value[spu.id || 0],
  );
  // 计算中间状态：不是全部选中 && 任意一个选中
  isIndeterminate.value =
    !isCheckAll.value &&
    list.value.some((spu) => checkedStatus.value[spu.id || 0]);
};

// 分类列表
const categoryList = ref<MallCategoryApi.Category[]>();
// 分类树
const categoryTreeList = ref();
/** 初始化 */
onMounted(async () => {
  await getList();
  // 获得分类树
  categoryList.value = await ProductCategoryApi.getCategoryList({});
  categoryTreeList.value = handleTree(categoryList.value, 'id', 'parentId');
});
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :append-to-body="true"
    title="选择商品"
    width="70%"
  >
    <ContentWrap>
      <ElForm
        :inline="true"
        :model="queryParams"
        class="-mb-15px"
        label-width="68px"
      >
        <ElFormItem label="商品名称" prop="name">
          <ElInput
            v-model="queryParams.name"
            class="!w-240px"
            clearable
            placeholder="请输入商品名称"
            @keyup.enter="handleQuery"
          />
        </ElFormItem>
        <ElFormItem label="商品分类" prop="categoryId">
          <ElTreeSelect
            v-model="queryParams.categoryId"
            :data="categoryTreeList"
            :props="{
              children: 'children',
              label: 'name',
              value: 'id',
              isLeaf: 'leaf',
              emitPath: false,
            }"
            check-strictly
            class="!w-240px"
            node-key="id"
            placeholder="请选择商品分类"
          />
        </ElFormItem>
        <ElFormItem label="创建时间" prop="createTime">
          <ElDatePicker
            v-model="queryParams.createTime"
            :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
            class="!w-240px"
            end-placeholder="结束日期"
            start-placeholder="开始日期"
            type="daterange"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton @click="handleQuery">
            <Icon class="mr-5px" icon="ep:search" />
            搜索
          </ElButton>
          <ElButton @click="resetQuery">
            <Icon class="mr-5px" icon="ep:refresh" />
            重置
          </ElButton>
        </ElFormItem>
      </ElForm>
      <ElTable v-loading="loading" :data="list" show-overflow-tooltip>
        <!-- 1. 多选模式（不能使用type="selection"，Element会忽略Header插槽） -->
        <ElTableColumn width="55" v-if="multiple">
          <template #header>
            <ElCheckbox
              v-model="isCheckAll"
              :indeterminate="isIndeterminate"
              @change="handleCheckAll"
            />
          </template>
          <template #default="{ row }">
            <ElCheckbox
              v-model="checkedStatus[row.id]"
              @change="(checked: boolean) => handleCheckOne(checked, row, true)"
            />
          </template>
        </ElTableColumn>
        <!-- 2. 单选模式 -->
        <ElTableColumn label="#" width="55" v-else>
          <template #default="{ row }">
            <ElRadio
              :value="row.id"
              v-model="selectedSpuId"
              @change="handleSingleSelected(row)"
            >
              <!-- 空格不能省略，是为了让单选框不显示label，如果不指定label不会有选中的效果 -->
              &nbsp;
            </ElRadio>
          </template>
        </ElTableColumn>
        <ElTableColumn
          key="id"
          align="center"
          label="商品编号"
          prop="id"
          min-width="60"
        />
        <ElTableColumn label="商品图" min-width="80">
          <template #default="{ row }">
            <ElImage
              :src="row.picUrl"
              class="h-30px w-30px"
              :preview-src-list="[row.picUrl]"
              preview-teleported
            />
          </template>
        </ElTableColumn>
        <ElTableColumn label="商品名称" min-width="200" prop="name" />
        <ElTableColumn label="商品分类" min-width="100" prop="categoryId">
          <template #default="{ row }">
            <span>{{
              categoryList?.find(
                (c: MallCategoryApi.Category) => c.id === row.categoryId,
              )?.name
            }}</span>
          </template>
        </ElTableColumn>
      </ElTable>
      <!-- 分页 -->
      <Pagination
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNo"
        :total="total"
        @pagination="getList"
      />
    </ContentWrap>
    <template #footer v-if="multiple">
      <ElButton type="primary" @click="handleEmitChange">确 定</ElButton>
      <ElButton @click="dialogVisible = false">取 消</ElButton>
    </template>
  </ElDialog>
</template>
