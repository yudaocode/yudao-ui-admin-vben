<!-- eslint-disable no-unused-vars -->
<script lang="ts" setup>
import { inject, nextTick, onBeforeUnmount, ref, toRaw, watch } from 'vue';

import {
  ElButton,
  ElCheckbox,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
} from 'element-plus';

import {
  APPROVE_METHODS,
  ApproveMethodType,
} from '#/views/bpm/components/simple-process-design/consts';

defineOptions({ name: 'ElementMultiInstance' });

const props = defineProps({
  businessObject: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  type: {
    type: String,
    required: false,
    default: '',
  },
  id: {
    type: String,
    required: false,
    default: '',
  },
});
const prefix = inject<string>('prefix');
const loopCharacteristics = ref('');
// 默认配置，用来覆盖原始不存在的选项，避免报错
const defaultLoopInstanceForm = ref({
  completionCondition: '',
  loopCardinality: '',
  extensionElements: [],
  asyncAfter: false,
  asyncBefore: false,
  exclusive: false,
});
interface LoopInstanceForm {
  completionCondition?: string;
  loopCardinality?: string;
  extensionElements?: any[];
  asyncAfter?: boolean;
  asyncBefore?: boolean;
  exclusive?: boolean;
  collection?: string;
  elementVariable?: string;
  timeCycle?: string;
}

const loopInstanceForm = ref<LoopInstanceForm>({});
const bpmnElement = ref<any>(null);
const multiLoopInstance = ref<any>(null);
declare global {
  interface Window {
    // @ts-ignore
    bpmnInstances?: () => any;
  }
}

const bpmnInstances = () => (window as any)?.bpmnInstances;

// eslint-disable-next-line unused-imports/no-unused-vars
const getElementLoop = (businessObject: any): void => {
  if (!businessObject.loopCharacteristics) {
    loopCharacteristics.value = 'Null';
    loopInstanceForm.value = {};
    return;
  }
  if (
    businessObject.loopCharacteristics.$type ===
    'bpmn:StandardLoopCharacteristics'
  ) {
    loopCharacteristics.value = 'StandardLoop';
    loopInstanceForm.value = {};
    return;
  }
  loopCharacteristics.value = businessObject.loopCharacteristics.isSequential
    ? 'SequentialMultiInstance'
    : 'ParallelMultiInstance';
  // 合并配置
  loopInstanceForm.value = {
    ...defaultLoopInstanceForm.value,
    ...businessObject.loopCharacteristics,
    completionCondition:
      businessObject.loopCharacteristics?.completionCondition?.body ?? '',
    loopCardinality:
      businessObject.loopCharacteristics?.loopCardinality?.body ?? '',
  };
  // 保留当前元素 businessObject 上的 loopCharacteristics 实例
  multiLoopInstance.value =
    bpmnInstances().bpmnElement.businessObject.loopCharacteristics;
  // 更新表单
  if (
    businessObject.loopCharacteristics.extensionElements &&
    businessObject.loopCharacteristics.extensionElements.values &&
    businessObject.loopCharacteristics.extensionElements.values.length > 0
  ) {
    loopInstanceForm.value.timeCycle =
      businessObject.loopCharacteristics.extensionElements.values[0].body;
  }
};

const changeLoopCharacteristicsType = (type: any): void => {
  // this.loopInstanceForm = { ...this.defaultLoopInstanceForm }; // 切换类型取消原表单配置
  // 取消多实例配置
  if (type === 'Null') {
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
      loopCharacteristics: null,
    });
    return;
  }
  // 配置循环
  if (type === 'StandardLoop') {
    const loopCharacteristicsObject = bpmnInstances().moddle.create(
      'bpmn:StandardLoopCharacteristics',
    );
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
      loopCharacteristics: loopCharacteristicsObject,
    });
    multiLoopInstance.value = null;
    return;
  }
  // 时序
  multiLoopInstance.value =
    type === 'SequentialMultiInstance'
      ? bpmnInstances().moddle.create('bpmn:MultiInstanceLoopCharacteristics', {
          isSequential: true,
        })
      : bpmnInstances().moddle.create('bpmn:MultiInstanceLoopCharacteristics', {
          // eslint-disable-next-line no-template-curly-in-string
          collection: '${coll_userList}',
        });
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    loopCharacteristics: toRaw(multiLoopInstance.value),
  });
};

// 循环基数
const updateLoopCardinality = (cardinality: string): void => {
  let loopCardinality = null;
  if (cardinality && cardinality.length > 0) {
    loopCardinality = bpmnInstances().moddle.create('bpmn:FormalExpression', {
      body: cardinality,
    });
  }
  bpmnInstances().modeling.updateModdleProperties(
    toRaw(bpmnElement.value),
    multiLoopInstance.value,
    {
      loopCardinality,
    },
  );
};

// 完成条件
const updateLoopCondition = (condition: string): void => {
  let completionCondition = null;
  if (condition && condition.length > 0) {
    completionCondition = bpmnInstances().moddle.create(
      'bpmn:FormalExpression',
      {
        body: condition,
      },
    );
  }
  bpmnInstances().modeling.updateModdleProperties(
    toRaw(bpmnElement.value),
    multiLoopInstance.value,
    {
      completionCondition,
    },
  );
};

// 重试周期
const updateLoopTimeCycle = (timeCycle: string): void => {
  const extensionElements = bpmnInstances().moddle.create(
    'bpmn:ExtensionElements',
    {
      values: [
        bpmnInstances().moddle.create(`${prefix}:FailedJobRetryTimeCycle`, {
          body: timeCycle,
        }),
      ],
    },
  );
  bpmnInstances().modeling.updateModdleProperties(
    toRaw(bpmnElement.value),
    multiLoopInstance.value,
    {
      extensionElements,
    },
  );
};

// 直接更新的基础信息
const updateLoopBase = (): void => {
  bpmnInstances().modeling.updateModdleProperties(
    toRaw(bpmnElement.value),
    multiLoopInstance.value,
    {
      collection: loopInstanceForm.value.collection || null,
      elementVariable: loopInstanceForm.value.elementVariable || null,
    },
  );
};

// 各异步状态
const updateLoopAsync = (key: any): void => {
  const { asyncBefore, asyncAfter } = loopInstanceForm.value;
  let asyncAttr = Object.create(null);
  if (!asyncBefore && !asyncAfter) {
    // this.$set(this.loopInstanceForm, "exclusive", false);
    loopInstanceForm.value.exclusive = false;
    asyncAttr = {
      asyncBefore: false,
      asyncAfter: false,
      exclusive: false,
      extensionElements: null,
    };
  } else {
    // @ts-ignore
    asyncAttr[key] = loopInstanceForm.value[key];
  }
  bpmnInstances().modeling.updateModdleProperties(
    toRaw(bpmnElement.value),
    multiLoopInstance.value,
    asyncAttr,
  );
};

const changeConfig = (config: string): void => {
  switch (config) {
    case '会签': {
      changeLoopCharacteristicsType('ParallelMultiInstance');
      // eslint-disable-next-line no-template-curly-in-string
      updateLoopCondition('${ nrOfCompletedInstances >= nrOfInstances }');

      break;
    }
    case '依次审批': {
      changeLoopCharacteristicsType('SequentialMultiInstance');
      updateLoopCardinality('1');
      // eslint-disable-next-line no-template-curly-in-string
      updateLoopCondition('${ nrOfCompletedInstances >= nrOfInstances }');

      break;
    }
    case '或签': {
      changeLoopCharacteristicsType('ParallelMultiInstance');
      // eslint-disable-next-line no-template-curly-in-string
      updateLoopCondition('${ nrOfCompletedInstances > 0 }');

      break;
    }
    // No default
  }
};

/**
 * -----新版本多实例-----
 */
const approveMethod = ref<ApproveMethodType | undefined>();
const approveRatio = ref<number>(100);
const otherExtensions = ref<any[]>([]);
const getElementLoopNew = (): void => {
  if (props.type === 'UserTask') {
    const loopCharacteristics =
      bpmnElement.value.businessObject?.loopCharacteristics;
    const extensionElements =
      bpmnElement.value.businessObject?.extensionElements ??
      bpmnInstances().moddle.create('bpmn:ExtensionElements', { values: [] });
    approveMethod.value = extensionElements.values.find(
      (ex: any) => ex.$type === `${prefix}:ApproveMethod`,
    )?.value;

    otherExtensions.value =
      extensionElements.values.filter(
        (ex: any) => ex.$type !== `${prefix}:ApproveMethod`,
      ) ?? [];

    if (!approveMethod.value) {
      approveMethod.value = ApproveMethodType.SEQUENTIAL_APPROVE;
      updateLoopCharacteristics();
    }

    // 如果是按比例会签，从现有 completionCondition 中解析比例，反推到 approveRatio
    if (
      approveMethod.value === ApproveMethodType.APPROVE_BY_RATIO &&
      loopCharacteristics?.completionCondition?.body
    ) {
      const body = loopCharacteristics.completionCondition.body as string;
      // 形如 "${ nrOfCompletedInstances/nrOfInstances >= 0.9 }"
      const match = body.match(/>=\s*(\d+(?:\.\d+)?)/);
      if (match) {
        const ratio = Number(match[1]);
        if (!Number.isNaN(ratio)) {
          approveRatio.value = ratio * 100;
        }
      }
    }
  }
};
const onApproveMethodChange = (): void => {
  updateLoopCharacteristics();
};
const onApproveRatioChange = (): void => {
  updateLoopCharacteristics();
};
const updateLoopCharacteristics = (): void => {
  // 根据ApproveMethod生成multiInstanceLoopCharacteristics节点
  if (approveMethod.value === ApproveMethodType.RANDOM_SELECT_ONE_APPROVE) {
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
      loopCharacteristics: null,
    });
  } else {
    if (approveMethod.value === ApproveMethodType.APPROVE_BY_RATIO) {
      multiLoopInstance.value = bpmnInstances().moddle.create(
        'bpmn:MultiInstanceLoopCharacteristics',
        // eslint-disable-next-line no-template-curly-in-string
        { isSequential: false, collection: '${coll_userList}' },
      );
      multiLoopInstance.value.completionCondition =
        bpmnInstances().moddle.create('bpmn:FormalExpression', {
          body: `\${ nrOfCompletedInstances/nrOfInstances >= ${
            approveRatio.value / 100
          }}`,
        });
    }
    if (approveMethod.value === ApproveMethodType.ANY_APPROVE) {
      multiLoopInstance.value = bpmnInstances().moddle.create(
        'bpmn:MultiInstanceLoopCharacteristics',
        // eslint-disable-next-line no-template-curly-in-string
        { isSequential: false, collection: '${coll_userList}' },
      );
      multiLoopInstance.value.completionCondition =
        bpmnInstances().moddle.create('bpmn:FormalExpression', {
          // eslint-disable-next-line no-template-curly-in-string
          body: '${ nrOfCompletedInstances > 0 }',
        });
    }
    if (approveMethod.value === ApproveMethodType.SEQUENTIAL_APPROVE) {
      multiLoopInstance.value = bpmnInstances().moddle.create(
        'bpmn:MultiInstanceLoopCharacteristics',
        // eslint-disable-next-line no-template-curly-in-string
        { isSequential: true, collection: '${coll_userList}' },
      );
      multiLoopInstance.value.loopCardinality = bpmnInstances().moddle.create(
        'bpmn:FormalExpression',
        {
          body: '1',
        },
      );
      multiLoopInstance.value.completionCondition =
        bpmnInstances().moddle.create('bpmn:FormalExpression', {
          // eslint-disable-next-line no-template-curly-in-string
          body: '${ nrOfCompletedInstances >= nrOfInstances }',
        });
    }
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
      loopCharacteristics: toRaw(multiLoopInstance.value),
    });
  }

  // 添加ApproveMethod到ExtensionElements
  const extensions = bpmnInstances().moddle.create('bpmn:ExtensionElements', {
    values: [
      ...otherExtensions.value,
      bpmnInstances().moddle.create(`${prefix}:ApproveMethod`, {
        value: approveMethod.value,
      }),
    ],
  });
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    extensionElements: extensions,
  });
};

onBeforeUnmount(() => {
  multiLoopInstance.value = null;
  bpmnElement.value = null;
});

watch(
  () => props.id,
  (val) => {
    if (val) {
      nextTick(() => {
        bpmnElement.value = bpmnInstances().bpmnElement;
        // getElementLoop(val)
        getElementLoopNew();
      });
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="-mx-2 mb-2 px-2">
    <ElRadioGroup
      v-if="type === 'UserTask'"
      v-model="approveMethod"
      @change="onApproveMethodChange"
    >
      <div class="flex flex-col gap-3">
        <div v-for="(item, index) in APPROVE_METHODS" :key="index">
          <ElRadio :value="item.value">
            {{ item.label }}
          </ElRadio>
          <ElInputNumber
            v-if="
              item.value === ApproveMethodType.APPROVE_BY_RATIO &&
              approveMethod === ApproveMethodType.APPROVE_BY_RATIO
            "
            v-model="approveRatio"
            :min="10"
            :max="100"
            :step="10"
            size="small"
            @change="onApproveRatioChange"
          />
        </div>
      </div>
    </ElRadioGroup>
    <div v-else>除了UserTask以外节点的多实例待实现</div>
    <!-- 与Simple设计器配置合并，保留以前的代码 -->
    <ElForm class="hidden">
      <ElFormItem label="快捷配置">
        <ElButton size="small" @click="() => changeConfig('依次审批')">
          依次审批
        </ElButton>
        <ElButton size="small" @click="() => changeConfig('会签')">
          会签
        </ElButton>
        <ElButton size="small" @click="() => changeConfig('或签')">
          或签
        </ElButton>
      </ElFormItem>
      <ElFormItem label="会签类型">
        <ElSelect
          v-model="loopCharacteristics"
          @change="changeLoopCharacteristicsType"
        >
          <ElOption value="ParallelMultiInstance" label="并行多重事件" />
          <ElOption value="SequentialMultiInstance" label="时序多重事件" />
          <ElOption value="Null" label="无" />
        </ElSelect>
      </ElFormItem>
      <template
        v-if="
          loopCharacteristics === 'ParallelMultiInstance' ||
          loopCharacteristics === 'SequentialMultiInstance'
        "
      >
        <ElFormItem label="循环数量" key="loopCardinality">
          <ElInput
            v-model="loopInstanceForm.loopCardinality"
            clearable
            @change="
              () =>
                updateLoopCardinality(loopInstanceForm.loopCardinality || '')
            "
          />
        </ElFormItem>
        <ElFormItem label="集合" key="collection" v-show="false">
          <ElInput
            v-model="loopInstanceForm.collection"
            clearable
            @change="() => updateLoopBase()"
          />
        </ElFormItem>
        <!-- add by 芋艿：由于「元素变量」暂时用不到，所以这里 display 为 none -->
        <ElFormItem label="元素变量" key="elementVariable" class="hidden">
          <ElInput
            v-model="loopInstanceForm.elementVariable"
            clearable
            @change="() => updateLoopBase()"
          />
        </ElFormItem>
        <ElFormItem label="完成条件" key="completionCondition">
          <ElInput
            v-model="loopInstanceForm.completionCondition"
            clearable
            @change="
              () =>
                updateLoopCondition(loopInstanceForm.completionCondition || '')
            "
          />
        </ElFormItem>
        <!-- add by 芋艿：由于「异步状态」暂时用不到，所以这里 display 为 none -->
        <ElFormItem label="异步状态" key="async" class="hidden">
          <ElCheckbox
            v-model="loopInstanceForm.asyncBefore"
            @change="() => updateLoopAsync('asyncBefore')"
          >
            异步前
          </ElCheckbox>
          <ElCheckbox
            v-model="loopInstanceForm.asyncAfter"
            @change="() => updateLoopAsync('asyncAfter')"
          >
            异步后
          </ElCheckbox>
          <ElCheckbox
            v-model="loopInstanceForm.exclusive"
            v-if="loopInstanceForm.asyncAfter || loopInstanceForm.asyncBefore"
            @change="() => updateLoopAsync('exclusive')"
          >
            排除
          </ElCheckbox>
        </ElFormItem>
        <ElFormItem
          label="重试周期"
          prop="timeCycle"
          v-if="loopInstanceForm.asyncAfter || loopInstanceForm.asyncBefore"
          key="timeCycle"
        >
          <ElInput
            v-model="loopInstanceForm.timeCycle"
            clearable
            @change="
              () => updateLoopTimeCycle(loopInstanceForm.timeCycle || '')
            "
          />
        </ElFormItem>
      </template>
    </ElForm>
  </div>
</template>
