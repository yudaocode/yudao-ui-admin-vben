<script lang="tsx">
import type { PropType } from 'vue'
import { defineComponent, ref } from 'vue'
import { Tag } from 'ant-design-vue'
import { isHexColor } from '@/utils/color'
import type { DictDataType } from '@/utils/dict'
import { getDictOpts } from '@/utils/dict'
import { propTypes } from '@/utils/propTypes'

export default defineComponent({
  name: 'DictTag',
  props: {
    type: {
      type: String as PropType<string>,
      required: true,
    },
    value: propTypes.oneOfType([propTypes.string, propTypes.number, propTypes.bool]),
    icon: { type: String },
  },
  setup(props) {
    const dictData = ref<DictDataType>()
    const getDictObj = (dictType: string, value: string) => {
      let dictOptions: DictDataType[] = []
      dictOptions = getDictOpts(dictType)
      if (dictOptions && dictOptions.length === 0)
        return

      dictOptions.forEach((dict: DictDataType) => {
        if (dict.value === value) {
          if (`${dict.colorType}` === 'primary')
            dict.colorType = 'processing'
          else if (`${dict.colorType}` === 'danger')
            dict.colorType = 'error'
          else if (`${dict.colorType}` === 'info')
            dict.colorType = 'default'

          dictData.value = dict
        }
      })
    }
    const rederDictTag = () => {
      if (!props.type)
        return null

      // 解决自定义字典标签值为零时标签不渲染的问题
      if (props.value === undefined || props.value === null)
        return null

      getDictObj(props.type, props.value.toString())

      if (dictData.value === undefined)
        return null

      // 添加标签的文字颜色为白色，解决自定义背景颜色时标签文字看不清的问题 && isHexColor(dictData.value?.cssClass)
      return (
        <Tag
          color={
            dictData.value?.colorType
              ? dictData.value?.colorType
              : dictData.value?.cssClass && isHexColor(dictData.value?.cssClass)
                ? dictData.value?.cssClass
                : ''
          }
        >
          {dictData.value?.label || ''}
        </Tag>
      )
    }
    return () => rederDictTag()
  },
})
</script>
