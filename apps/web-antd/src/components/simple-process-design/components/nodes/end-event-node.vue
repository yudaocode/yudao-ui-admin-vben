<script setup lang="ts">
import type { Ref } from 'vue';

import type { SimpleFlowNode } from '../../consts';

import { inject, ref } from 'vue';

import { useTaskStatusClass, useWatchNode } from '../../helpers';

defineOptions({ name: 'EndEventNode' });
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    default: () => null,
  },
});
// 监控节点变化
const currentNode = useWatchNode(props);
// 是否只读
const readonly = inject<Boolean>('readonly');
const processInstance = inject<Ref<any>>('processInstance', ref({}));

const processInstanceInfos = ref<any[]>([]); // 流程的审批信息

function nodeClick() {
  if (readonly && processInstance && processInstance.value) {
    console.warn(
      'TODO 只读模式，弹窗显示审批信息',
      processInstance.value,
      processInstanceInfos.value,
    );
  }
}
</script>
<template>
  <div class="end-node-wrapper">
    <div
      class="end-node-box cursor-pointer"
      :class="`${useTaskStatusClass(currentNode?.activityStatus)}`"
      @click="nodeClick"
    >
      <span class="node-fixed-name" title="结束">结束</span>
    </div>
  </div>
  <!-- TODO 审批信息 -->
</template>
