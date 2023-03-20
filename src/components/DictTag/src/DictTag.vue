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
    }
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
          if (dict.colorType + '' === 'primary' || dict.colorType + '' === 'default') {
            dict.colorType = ''
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
      if (props.value === undefined) {
        return null
      }
      getDictObj(props.type, props.value.toString())
      // 添加标签的文字颜色为白色，解决自定义背景颜色时标签文字看不清的问题
      return (
        <Tag
          style={dictData.value?.cssClass ? 'color: #108ee9' : ''}
          type={dictData.value?.colorType}
          color={dictData.value?.cssClass && isHexColor(dictData.value?.cssClass) ? dictData.value?.cssClass : ''}
        >
          {dictData.value?.label}
        </Tag>
      )
    }
    return () => rederDictTag()
  }
})
</script>
