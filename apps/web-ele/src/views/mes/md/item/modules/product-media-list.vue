<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesMdProductSipApi } from '#/api/mes/md/item/productSip';
import type { MesMdProductSopApi } from '#/api/mes/md/item/productSop';

import { computed, markRaw, ref, watch } from 'vue';

import {
  ElButton,
  ElCard,
  ElDialog,
  ElEmpty,
  ElImage,
  ElMessage,
  ElPopconfirm,
} from 'element-plus';

import { useVbenForm, z } from '#/adapter/form';
import {
  createProductSip,
  deleteProductSip,
  getProductSipListByItemId,
  updateProductSip,
} from '#/api/mes/md/item/productSip';
import {
  createProductSop,
  deleteProductSop,
  getProductSopListByItemId,
  updateProductSop,
} from '#/api/mes/md/item/productSop';
import { ImageUpload } from '#/components/upload';
import { ProProcessSelect } from '#/views/mes/pro/process/components';

type MediaKind = 'SIP' | 'SOP';
type MediaItem = MesMdProductSipApi.ProductSip | MesMdProductSopApi.ProductSop;

const props = withDefaults(
  defineProps<{
    formType?: FormType;
    itemId: number;
    kind: MediaKind;
  }>(),
  {
    formType: 'update',
  },
);

const isReadOnly = computed(() => props.formType === 'detail'); // 是否只读
const title = computed(() => props.kind); // 当前媒体类型标题
const loading = ref(false); // SIP/SOP 列表加载中
const formOpen = ref(false); // SIP/SOP 表单是否打开
const formLoading = ref(false); // SIP/SOP 表单提交中
const formData = ref<MediaItem>();
const list = ref<MediaItem[]>([]); // SIP/SOP 列表

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'itemId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'title',
      label: '标题',
      component: 'Input',
      componentProps: {
        placeholder: '请输入标题',
      },
      rules: 'required',
    },
    {
      fieldName: 'sort',
      label: '展示顺序',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 0,
        precision: 0,
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'description',
      label: '内容说明',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入详细描述',
        rows: 3,
      },
    },
    {
      fieldName: 'processId',
      label: '所属工序',
      component: markRaw(ProProcessSelect),
    },
    {
      fieldName: 'url',
      label: '图片',
      component: markRaw(ImageUpload),
      componentProps: {
        maxNumber: 1,
        showDescription: false,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ],
  showDefaultActions: false,
});

/** 获取当前媒体类型的列表接口 */
function getListApi() {
  return props.kind === 'SIP'
    ? getProductSipListByItemId
    : getProductSopListByItemId;
}

/** 获取当前媒体类型的新增接口 */
function createApi() {
  return props.kind === 'SIP' ? createProductSip : createProductSop;
}

/** 获取当前媒体类型的修改接口 */
function updateApi() {
  return props.kind === 'SIP' ? updateProductSip : updateProductSop;
}

/** 获取当前媒体类型的删除接口 */
function deleteApi() {
  return props.kind === 'SIP' ? deleteProductSip : deleteProductSop;
}

/** 加载 SIP/SOP 列表 */
async function getList() {
  loading.value = true;
  try {
    list.value = await getListApi()(props.itemId);
  } finally {
    loading.value = false;
  }
}

/** 打开 SIP/SOP 表单 */
async function openForm(row?: MediaItem) {
  formOpen.value = true;
  formData.value = row;
  await formApi.resetForm();
  await formApi.setValues({
    itemId: props.itemId,
    sort: 0,
    ...row,
  });
}

/** 提交 SIP/SOP 表单 */
async function submitForm() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  formLoading.value = true;
  try {
    const data = (await formApi.getValues()) as MediaItem;
    await (formData.value?.id
      ? updateApi()(data as any)
      : createApi()(data as any));
    formOpen.value = false;
    ElMessage.success('保存成功');
    await getList();
  } finally {
    formLoading.value = false;
  }
}

/** 删除 SIP/SOP */
async function handleDelete(id: number) {
  await deleteApi()(id);
  ElMessage.success('删除成功');
  await getList();
}

watch(
  () => props.itemId,
  (value) => {
    if (value) {
      getList();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div>
    <ElButton
      v-if="!isReadOnly"
      class="mb-3"
      type="primary"
      @click="openForm()"
    >
      添加 {{ title }}
    </ElButton>
    <div v-loading="loading">
      <div v-if="list.length > 0" class="grid grid-cols-4 gap-3">
        <ElCard
          v-for="item in list"
          :key="item.id"
          :body-style="{ padding: '0px' }"
          shadow="hover"
        >
          <ElImage
            v-if="item.url"
            :src="item.url"
            class="block h-40 w-full object-cover"
            :preview-src-list="[item.url]"
            fit="cover"
          />
          <div
            v-else
            class="flex h-40 w-full items-center justify-center bg-gray-100 text-gray-400"
          >
            暂无图片
          </div>
          <div class="p-3">
            <div class="mb-1 truncate text-sm font-bold">{{ item.title }}</div>
            <div v-if="item.description" class="truncate text-xs text-gray-500">
              {{ item.description }}
            </div>
            <div v-if="!isReadOnly" class="mt-2 flex justify-end">
              <ElButton
                link
                type="primary"
                size="small"
                @click="openForm(item)"
              >
                编辑
              </ElButton>
              <ElPopconfirm
                title="确认删除该数据吗？"
                @confirm="handleDelete(item.id!)"
              >
                <template #reference>
                  <ElButton link type="danger" size="small">删除</ElButton>
                </template>
              </ElPopconfirm>
            </div>
          </div>
        </ElCard>
      </div>
      <ElEmpty v-else :description="`暂无 ${title} 数据`" />
    </div>

    <ElDialog
      v-model="formOpen"
      :title="`${formData?.id ? '编辑' : '新增'} ${title}`"
      width="500px"
    >
      <Form class="mx-4" />
      <template #footer>
        <ElButton @click="formOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="formLoading" @click="submitForm">
          确定
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>
