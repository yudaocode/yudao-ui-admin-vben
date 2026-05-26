<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesProFeedbackApi } from '#/api/mes/pro/feedback';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElButton,
  ElMessage,
  ElPopconfirm,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import {
  approveFeedback,
  createFeedback,
  getFeedback,
  rejectFeedback,
  submitFeedback,
  updateFeedback,
} from '#/api/mes/pro/feedback';
import { getRouteProcessByRouteAndProcess } from '#/api/mes/pro/route/process';
import { $t } from '#/locales';
import {
  MesAutoCodeRuleCode,
  MesProFeedbackStatusEnum,
} from '#/views/mes/utils/constants';

import { useFormSchema } from '../data';
import ItemConsumeList from './item-consume-list.vue';
import ProductProduceList from './product-produce-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesProFeedbackApi.Feedback>();
const userStore = useUserStore();
const subTabsName = ref('itemConsume');

const isEditable = computed(() =>
  ['create', 'submit', 'update'].includes(formType.value),
);
const canSubmit = computed(
  () =>
    isEditable.value &&
    formData.value?.status === MesProFeedbackStatusEnum.PREPARE,
);
const canApprove = computed(() => formType.value === 'approve');
const showSubTabs = computed(
  () =>
    !!formData.value?.id &&
    formData.value?.status !== MesProFeedbackStatusEnum.PREPARE &&
    formData.value?.status !== MesProFeedbackStatusEnum.APPROVING,
);
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['生产报工']);
  }
  if (formType.value === 'approve') {
    return '审批生产报工';
  }
  if (formType.value === 'submit') {
    return '提交生产报工';
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['生产报工'])
    : $t('ui.actionTitle.create', ['生产报工']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 110,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-3',
});

/** 表单 schema 需要 formApi 引用，所以通过 setState 设置 schema */
formApi.setState({ schema: useFormSchema(formType.value, formApi) });

/** 提交前对齐数量：根据 checkFlag 决定 uncheck/合格/不良归零策略 */
function alignQuantity(data: MesProFeedbackApi.Feedback) {
  if (data.checkFlag) {
    data.uncheckQuantity = data.feedbackQuantity;
    data.qualifiedQuantity = 0;
    data.unqualifiedQuantity = 0;
    data.laborScrapQuantity = 0;
    data.materialScrapQuantity = 0;
    data.otherScrapQuantity = 0;
  } else {
    data.feedbackQuantity =
      (data.qualifiedQuantity || 0) + (data.unqualifiedQuantity || 0);
    data.uncheckQuantity = 0;
  }
}

/** 保存：create 后切换为 update 模式 */
async function handleSave() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  modalApi.lock();
  try {
    const data = (await formApi.getValues()) as MesProFeedbackApi.Feedback;
    alignQuantity(data);
    if (formType.value === 'create') {
      const id = await createFeedback(data);
      formData.value = {
        ...data,
        id,
        status: MesProFeedbackStatusEnum.PREPARE,
      };
      formType.value = 'update';
      formApi.setState({ schema: useFormSchema(formType.value, formApi) });
      await formApi.setFieldValue('id', id);
      ElMessage.success($t('common.createSuccess'));
    } else {
      await updateFeedback(data);
      formData.value = { ...formData.value, ...data };
      ElMessage.success($t('common.updateSuccess'));
    }
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 提交：保存最新内容后调用提交接口 */
async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  modalApi.lock();
  try {
    const data = (await formApi.getValues()) as MesProFeedbackApi.Feedback;
    alignQuantity(data);
    let id = formData.value?.id;
    if (formType.value === 'create' || !id) {
      id = await createFeedback(data);
    } else {
      await updateFeedback(data);
    }
    await submitFeedback(id!);
    await modalApi.close();
    emit('success');
    ElMessage.success('报工单已提交');
  } finally {
    modalApi.unlock();
  }
}

/** 审批通过 */
async function handleApprove() {
  if (!formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    const finished = await approveFeedback(formData.value.id);
    await modalApi.close();
    emit('success');
    ElMessage.success(
      finished ? '报工单已审批完成' : '报工成功，请等待质量检验完成！',
    );
  } finally {
    modalApi.unlock();
  }
}

/** 审批不通过 */
async function handleReject() {
  if (!formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    await rejectFeedback(formData.value.id);
    await modalApi.close();
    emit('success');
    ElMessage.success('报工单已驳回');
  } finally {
    modalApi.unlock();
  }
}

/** 加载工序的 checkFlag 用于回显数量区域 */
async function resolveCheckFlag(routeId?: number, processId?: number) {
  if (!routeId || !processId) {
    return true;
  }
  try {
    const routeProcess = await getRouteProcessByRouteAndProcess(
      routeId,
      processId,
    );
    return routeProcess?.checkFlag ?? false;
  } catch {
    return true;
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (formType.value === 'detail' || formType.value === 'approve') {
      await modalApi.close();
      return;
    }
    await handleSave();
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      subTabsName.value = 'itemConsume';
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setState({ schema: useFormSchema(formType.value, formApi) });
    // 审批/详情整表禁用，避免审核人误改未提交的字段
    formApi.setDisabled(
      formType.value === 'approve' || formType.value === 'detail',
    );
    modalApi.setState({
      showConfirmButton:
        formType.value !== 'detail' && formType.value !== 'approve',
    });
    await formApi.resetForm();
    if (!data?.id) {
      // 新增：默认报工人和报工时间，并自动生成报工单号
      const code = await generateAutoCode(
        MesAutoCodeRuleCode.PRO_FEEDBACK_CODE,
      );
      await formApi.setValues({
        code,
        feedbackTime: Date.now(),
        feedbackUserId: userStore.userInfo?.id,
      });
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getFeedback(data.id);
      const checkFlag = await resolveCheckFlag(
        formData.value.routeId,
        formData.value.processId,
      );
      // 设置到 values
      await formApi.setValues({ ...formData.value, checkFlag });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
    <ElTabs
      v-if="showSubTabs"
      v-model="subTabsName"
      type="card"
      class="mx-4 mt-2"
    >
      <ElTabPane label="BOM 物资消耗" name="itemConsume">
        <ItemConsumeList :feedback-id="formData!.id!" />
      </ElTabPane>
      <ElTabPane label="产品产出" name="productProduce">
        <ProductProduceList :feedback-id="formData!.id!" />
      </ElTabPane>
    </ElTabs>
    <template #prepend-footer>
      <div class="flex flex-auto items-center justify-end gap-2">
        <ElPopconfirm
          v-if="canSubmit"
          title="确认提交该报工单？提交后将不能修改。"
          @confirm="handleSubmit"
        >
          <template #reference>
            <ElButton type="primary">{{ $t('common.submit') }}</ElButton>
          </template>
        </ElPopconfirm>
        <ElPopconfirm
          v-if="canApprove"
          title="确认审批通过该报工单？"
          @confirm="handleApprove"
        >
          <template #reference>
            <ElButton type="success">通过</ElButton>
          </template>
        </ElPopconfirm>
        <ElPopconfirm
          v-if="canApprove"
          title="确认驳回该报工单？"
          @confirm="handleReject"
        >
          <template #reference>
            <ElButton type="danger">不通过</ElButton>
          </template>
        </ElPopconfirm>
      </div>
    </template>
  </Modal>
</template>
