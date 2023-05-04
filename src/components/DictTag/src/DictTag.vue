<script lang="tsx">
import { defineComponent, PropType, ref } from 'vue'
import { isHexColor } from '@/utils/color'
import { Tag } from 'ant-design-vue'
import { DictDataType, getBoolDictOptions, getDictOptions, getStrDictOptions } from '@/utils/dict'

export default defineComponent({
  name: 'DictTag',
  props: {
    type: {
      type: String as PropType<string>,
      required: true
    },
    value: {
      type: [String, Number, Boolean] as PropType<string | number | boolean>,
      required: true
    },
    dictType: {
      type: String as PropType<string>,
      required: false,
      default: () => 'number'
    },
    icon: { type: String }
  },
  setup(props) {
    const dictData = ref<DictDataType>()
    const getDictObj = (dictType: string, value: string) => {
      let dictOptions: DictDataType[] = []
      if (props.dictType && props.dictType === 'boolean') {
        dictOptions = getBoolDictOptions(dictType)
      } else if (props.dictType && props.dictType === 'string') {
        dictOptions = getStrDictOptions(dictType)
      } else {
        dictOptions = getDictOptions(dictType)
      }
      dictOptions.forEach((dict: DictDataType) => {
        if (dict.value === value) {
          if (dict.colorType + '' === 'primary') {
            dict.colorType = 'processing'
          } else if (dict.colorType + '' === 'danger') {
            dict.colorType = 'error'
          } else if (dict.colorType + '' === 'info') {
            dict.colorType = 'default'
          }
          dictData.value = dict
        }
      })
    }
    const rederDictTag = () => {
      if (!props.type) {
        return null
      }
      // 解决自定义字典标签值为零时标签不渲染的问题
      if (props.value === undefined && props.value !== null) {
        return null
      }
      getDictObj(props.type, props.value.toString())
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
          {dictData.value?.label}
        </Tag>
      )
    }
    return () => rederDictTag()
  }
})
</script>
