<script lang="ts">
import { defineComponent, reactive } from 'vue'
import draggable from 'vuedraggable'
import type { IVFormComponent } from '../../../typings/v-form-component'

// import { toRefs } from '@vueuse/core';
import { Icon } from '@/components/Icon'

export default defineComponent({
  name: 'CollapseItem',
  components: { Draggable: draggable, Icon },
  props: {
    list: {
      type: [Array] as PropType<IVFormComponent[]>,
      default: () => [],
    },
    handleListPush: {
      type: Function as PropType<(item: IVFormComponent) => void>,
      default: null,
    },
  },
  setup(props, { emit }) {
    const state = reactive({})
    const handleStart = (e: any, list1: IVFormComponent[]) => {
      emit('start', list1[e.oldIndex].component)
    }
    const handleAdd = (e: any) => {
      console.log(e)
    }
    // https://github.com/SortableJS/vue.draggable.next
    // https://github.com/SortableJS/vue.draggable.next/blob/master/example/components/custom-clone.vue
    const cloneItem = (one) => {
      return props.handleListPush(one)
    }
    return { state, handleStart, handleAdd, cloneItem }
  },
})
</script>

<template>
  <div>
    <Draggable
      tag="ul"
      :model-value="list"
      v-bind="{
        group: { name: 'form-draggable', pull: 'clone', put: false },
        sort: false,
        clone: cloneItem,
        animation: 180,
        ghostClass: 'moving',
      }"
      item-key="type"
      @start="handleStart($event, list)"
      @add="handleAdd"
    >
      <template #item="{ element, index }">
        <li class="bs-box text-ellipsis" @dragstart="$emit('add-attrs', list, index)" @click="$emit('handle-list-push', element)">
          <!-- <svg v-if="element.icon.indexOf('icon-') > -1" class="icon" aria-hidden="true">
            <use :xlink:href="`#${element.icon}`" />
          </svg> -->
          <Icon :icon="element.icon" />
          {{ element.label }}
        </li>
      </template>
    </Draggable>
  </div>
</template>

<style lang="less" scoped>
@import url('../styles/variable.less');

ul {
  display: flex;
  flex-wrap: wrap;
  padding: 5px;
  margin-bottom: 0;
  list-style: none;
  // background: #efefef;

  li {
    width: calc(50% - 6px);
    height: 36px;
    padding: 8px 12px;
    margin: 2.7px;
    line-height: 20px;
    cursor: move;
    border: 1px solid var(--border-color);
    border-radius: 3px;
    transition: all 0.3s;

    &:hover {
      position: relative;
    }
  }
}

svg {
  display: inline !important;
}
</style>
