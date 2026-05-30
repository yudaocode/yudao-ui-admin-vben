<script lang="ts" setup>
import type { MesProRouteProcessApi } from '#/api/mes/pro/route/process';
import type { MesProWorkOrderApi } from '#/api/mes/pro/workorder';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElButton, ElCard, ElMessage, ElPopconfirm, ElStep, ElSteps } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { getRouteProcessListByProduct } from '#/api/mes/pro/route/process';
import { finishWorkOrder, getWorkOrder } from '#/api/mes/pro/workorder';

import { useScheduleFormSchema } from '../data';
import TaskList from './task-list.vue';

const emit = defineEmits(['success']);
const formType = ref<'detail' | 'schedule'>('schedule');
const workOrder = ref<MesProWorkOrderApi.WorkOrder>(); // 当前工单详情
const routeProcessList = ref<MesProRouteProcessApi.RouteProcess[]>([]); // 工艺路线工序列表
const activeProcessStep = ref(0); // 当前工序步骤索引
const currentRouteId = ref(0); // 当前工艺路线编号

const isReadonly = computed(() => formType.value === 'detail'); // 详情态只读
const getTitle = computed(() =>
  formType.value === 'detail' ? '工单详情' : '生产排产',
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useScheduleFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-3',
});

/** 加载工艺路线工序列表 */
async function loadRouteProcesses(productId: number) {
  const processes = await getRouteProcessListByProduct(productId);
  if (!processes || processes.length === 0) {
    ElMessage.warning('当前产品未配置工艺路线，请先在工艺路线中维护');
    return;
  }
  currentRouteId.value = processes[0]!.routeId ?? 0;
  routeProcessList.value = [...processes].toSorted(
    (a, b) => (a.sort ?? 0) - (b.sort ?? 0),
  );
}

/** 完成工单 */
async function handleFinish() {
  if (!workOrder.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    await finishWorkOrder(workOrder.value.id);
    ElMessage.success('工单已完成');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal({
  showConfirmButton: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      workOrder.value = undefined;
      routeProcessList.value = [];
      activeProcessStep.value = 0;
      currentRouteId.value = 0;
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ formType: 'detail' | 'schedule'; id: number }>();
    formType.value = data.formType;
    activeProcessStep.value = 0;
    routeProcessList.value = [];
    modalApi.lock();
    try {
      workOrder.value = await getWorkOrder(data.id);
      // 设置到 values
      await formApi.setValues(workOrder.value);
      if (workOrder.value.productId) {
        await loadRouteProcesses(workOrder.value.productId);
      }
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-4/5">
    <Form class="mx-4" />
    <!-- 工序步骤导航 + 当前工序任务列表 -->
    <template v-if="routeProcessList.length > 0 && workOrder?.id">
      <ElSteps
        :active="activeProcessStep"
        align-center
        class="my-4 px-4"
        simple
      >
        <ElStep
          v-for="(rp, index) in routeProcessList"
          :key="rp.processId"
          class="cursor-pointer"
          :title="rp.processName"
          @click="activeProcessStep = index"
        />
      </ElSteps>
      <ElCard
        v-for="(rp, index) in routeProcessList"
        v-show="activeProcessStep === index"
        :key="rp.processId"
        class="mx-4"
        shadow="never"
      >
        <TaskList
          :color-code="rp.colorCode"
          :disabled="isReadonly"
          :item-id="workOrder.productId"
          :process-id="rp.processId!"
          :route-id="currentRouteId"
          :work-order-id="workOrder.id!"
        />
      </ElCard>
    </template>
    <template #prepend-footer>
      <div class="flex flex-auto items-center gap-2">
        <ElPopconfirm
          v-if="formType === 'schedule'"
          title="确认要完成该工单吗？完成后工单下所有任务将标记为已完成。"
          width="320"
          @confirm="handleFinish"
        >
          <template #reference>
            <ElButton type="primary">完成</ElButton>
          </template>
        </ElPopconfirm>
      </div>
    </template>
  </Modal>
</template>
