<!--
 * @Description: 拖拽节点控件
-->
<script lang="ts">
import type { PropType } from 'vue'
import { defineComponent, reactive, toRefs } from 'vue'
import type { IVFormComponent } from '../../../typings/v-form-component'
import { useFormDesignState } from '../../../hooks/useFormDesignState'
import VFormItem from '../../VFormItem/index.vue'
import FormNodeOperate from './FormNodeOperate.vue'

// import VFormItem from '../../VFormItem/vFormItem.vue';
export default defineComponent({
  name: 'FormNode',
  components: {
    VFormItem,
    FormNodeOperate,
  },
  props: {
    schema: {
      type: Object as PropType<IVFormComponent>,
      required: true,
    },
  },
  setup(props) {
    const { formConfig, formDesignMethods } = useFormDesignState()
    const state = reactive({})
    // 获取 formDesignMethods
    const handleSelectItem = () => {
      // 调用 formDesignMethods
      formDesignMethods.handleSetSelectItem(props.schema)
    }
    return {
      ...toRefs(state),
      handleSelectItem,
      formConfig,
    }
  },
})
</script>

<template>
  <div class="drag-move-box" :class="{ active: schema.key === formConfig.currentItem?.key }" @click.stop="handleSelectItem">
    <div class="form-item-box">
      <VFormItem :form-config="formConfig" :schema="schema" />
    </div>
    <div class="show-key-box">
      {{ schema.label + (schema.field ? `/${schema.field}` : '') }}
    </div>
    <FormNodeOperate :schema="schema" :current-item="formConfig.currentItem" />
  </div>
</template>
