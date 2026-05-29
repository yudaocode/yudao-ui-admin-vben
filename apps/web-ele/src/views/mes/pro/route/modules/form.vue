<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesProRouteApi } from '#/api/mes/pro/route';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage, ElTabPane, ElTabs } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { createRoute, getRoute, updateRoute } from '#/api/mes/pro/route';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import ProcessList from './process-list.vue';
import ProductList from './product-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create'); // 表单模式
const subTab = ref('process'); // 当前激活的子表 Tab
const formData = ref<MesProRouteApi.Route>();

const isDetail = computed(() => formType.value === 'detail'); // 是否查看模式
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.detail', ['工艺路线']);
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['工艺路线'])
    : $t('ui.actionTitle.create', ['工艺路线']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-1',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (isDetail.value) {
      await modalApi.close();
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MesProRouteApi.Route;
    try {
      if (formType.value === 'create') {
        // 新增成功后切到编辑模式，方便继续维护组成工序、关联产品
        const id = await createRoute(data);
        formData.value = { ...data, id };
        await formApi.setFieldValue('id', id);
        formType.value = 'update';
      } else {
        await updateRoute(data);
        formData.value = { ...formData.value, ...data };
      }
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    formApi.setState({ schema: useFormSchema(formApi) });
    subTab.value = 'process';
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setDisabled(formType.value === 'detail');
    modalApi.setState({ showConfirmButton: formType.value !== 'detail' });
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getRoute(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-4/5">
    <Form class="mx-4" />
    <!-- 编辑/详情模式下展示子表 Tab，新增模式下隐藏 -->
    <ElTabs
      v-if="formType !== 'create' && formData?.id"
      v-model="subTab"
      class="mx-4 mt-4"
    >
      <ElTabPane label="组成工序" name="process">
        <ProcessList :form-type="formType" :route-id="formData.id" />
      </ElTabPane>
      <ElTabPane label="关联产品" name="product">
        <ProductList :form-type="formType" :route-id="formData.id" />
      </ElTabPane>
    </ElTabs>
  </Modal>
</template>
