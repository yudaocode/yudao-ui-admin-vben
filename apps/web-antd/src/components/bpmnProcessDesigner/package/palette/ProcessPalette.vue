<script lang="ts" setup>
import { Button } from 'ant-design-vue';
import { assign } from 'min-dash';

defineOptions({ name: 'MyProcessPalette' });

const bpmnInstances = () =>
  (window as typeof window & { bpmnInstances?: any }).bpmnInstances;
const addTask = (event: MouseEvent, options: any = {}) => {
  const ElementFactory = bpmnInstances().elementFactory;
  const create = bpmnInstances().modeler.get('create');

  const shape = ElementFactory.createShape(
    assign({ type: 'bpmn:UserTask' }, options),
  );

  if (options) {
    shape.businessObject.di.isExpanded = options.isExpanded;
  }
  create.start(event, shape);
};
</script>

<template>
  <div class="my-process-palette p-20 pt-80">
    <Button type="primary" @click="addTask" @mousedown="addTask">
      测试任务
    </Button>
    <div class="test-container" id="palette-container">1</div>
  </div>
</template>

<style scoped>
.test-container {
  margin-top: 16px;
}
</style>
