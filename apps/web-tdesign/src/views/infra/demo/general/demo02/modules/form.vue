<script lang="ts" setup>
import type { FormRule } from 'tdesign-vue-next';

import type { Demo02CategoryApi } from '#/api/infra/demo/demo02';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import { Form, FormItem, Input, TreeSelect } from 'tdesign-vue-next';

import { message } from '#/adapter/tdesign';
import {
  createDemo02Category,
  getDemo02Category,
  getDemo02CategoryList,
  updateDemo02Category,
} from '#/api/infra/demo/demo02';
import { $t } from '#/locales';

type Rule = FormRule;

const emit = defineEmits(['success']);

const formRef = ref();
const formData = ref<Partial<Demo02CategoryApi.Demo02Category>>({
  id: undefined,
  name: undefined,
  parentId: undefined,
});
const rules: Record<string, Rule[]> = {
  name: [{ required: true, message: '名字不能为空', trigger: 'blur' }],
  parentId: [{ required: true, message: '父级编号不能为空', trigger: 'blur' }],
};
const demo02CategoryTree = ref<any[]>([]); // 树形结构
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['示例分类'])
    : $t('ui.actionTitle.create', ['示例分类']);
});

/** 重置表单 */
function resetForm() {
  formData.value = {
    id: undefined,
    name: undefined,
    parentId: undefined,
  };
  formRef.value?.clearValidate();
}

/** 获得示例分类树 */
async function getDemo02CategoryTree() {
  demo02CategoryTree.value = [];
  const data = await getDemo02CategoryList({});
  data.unshift({
    id: 0,
    name: '顶级示例分类',
  });
  demo02CategoryTree.value = handleTree(data);
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const valid = await formRef.value?.validate();
    if (valid !== true) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = formData.value as Demo02CategoryApi.Demo02Category;
    try {
      await (formData.value?.id
        ? updateDemo02Category(data)
        : createDemo02Category(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      resetForm();
      return;
    }
    // 加载树数据（新增时 data 为空，也需要加载）
    await getDemo02CategoryTree();
    // 加载数据
    let data = modalApi.getData() as Demo02CategoryApi.Demo02Category;
    if (!data) {
      return;
    }
    if (data.id) {
      modalApi.lock();
      try {
        data = await getDemo02Category(data.id);
      } finally {
        modalApi.unlock();
      }
    }
    formData.value = data;
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form ref="formRef" :data="formData" :rules="rules" label-width="80px">
      <FormItem label="名字" name="name">
        <Input v-model="formData.name" placeholder="请输入名字" />
      </FormItem>
      <FormItem label="父级编号" name="parentId">
        <TreeSelect
          v-model="formData.parentId"
          :data="demo02CategoryTree"
          :keys="{
            label: 'name',
            value: 'id',
            children: 'children',
          }"
          :tree-props="{ expandAll: true }"
          placeholder="请选择父级编号"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
