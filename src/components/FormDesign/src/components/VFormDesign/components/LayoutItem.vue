<!--
 * @Description: 表单项布局控件
 * 千万不要在template下面的第一行加注释，因为这里拖动的第一个元素
-->

<script lang="ts" setup>
import type { PropType } from 'vue'
import { computed } from 'vue'
import draggable from 'vuedraggable'
import { Col, Row } from 'ant-design-vue'
import { useFormDesignState } from '../../../hooks/useFormDesignState'
import type { IVFormComponent } from '../../../typings/v-form-component'
import FormNode from './FormNode.vue'
import FormNodeOperate from './FormNodeOperate.vue'

const props = defineProps(
  {
    schema: {
      type: Object as PropType<IVFormComponent>,
      required: true,
    },
    currentItem: {
      type: Object,
      required: true,
    },
  },
)

const emit = defineEmits(['dragStart', 'handleColAdd', 'handle-copy', 'handle-delete'])

const Draggable = draggable

const { formDesignMethods: { handleSetSelectItem }, formConfig } = useFormDesignState()
const colPropsComputed = computed(() => {
  const { colProps = {} } = props.schema
  return colProps
})

const list1 = computed(() => props.schema.columns)

// 计算布局元素，水平模式下为ACol，非水平模式下为div
const layoutTag = computed(() => {
  return formConfig.value.layout === 'horizontal' ? 'Col' : 'div'
})
</script>

<template>
  <Col v-bind="colPropsComputed">
    <template v-if="['Grid'].includes(schema.component)">
      <div class="grid-box" :class="{ active: schema.key === currentItem.key }" @click.stop="handleSetSelectItem(schema)">
        <Row class="grid-row" v-bind="schema.componentProps">
          <Col v-for="(colItem, index) in schema.columns" :key="index" class="grid-col" :span="colItem.span">
            <Draggable
              v-bind="{
                group: 'form-draggable',
                ghostClass: 'moving',
                animation: 180,
                handle: '.drag-move',
              }"
              v-model="colItem.children"
              class="draggable-box list-main"
              :component-data="{ name: 'list', tag: 'div', type: 'transition-group' }"
              item-key="key"
              @start="$emit('dragStart', $event, colItem.children)"
              @add="$emit('handleColAdd', $event, colItem.children)"
            >
              <template #item="{ element }">
                <LayoutItem
                  class="drag-move"
                  :schema="element"
                  :current-item="currentItem"
                  @handle-copy="emit('handle-copy')"
                  @handle-delete="emit('handle-delete')"
                />
              </template>
            </Draggable>
          </Col>
        </Row>
        <FormNodeOperate :schema="schema" :current-item="currentItem" />
      </div>
    </template>
    <FormNode
      v-else
      :key="schema.key"
      :schema="schema"
      :current-item="currentItem"
      @handle-copy="emit('handle-copy')"
      @handle-delete="emit('handle-delete')"
    />
  </Col>
</template>

<style lang="less">
@import url('../styles/variable.less');

.layout-width {
  width: 100%;
}

.hidden-item {
  background-color: rgb(240 191 195);
}
</style>
