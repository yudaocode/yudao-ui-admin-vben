import { defineComponent } from 'vue';

import ImageUpload from '#/components/upload/image-upload.vue';

export function useImagesUpload() {
  return defineComponent({
    name: 'ImagesUpload',
    props: {
      multiple: {
        type: Boolean,
        default: true,
      },
      maxNumber: {
        type: Number,
        default: 5,
      },
    },
    setup(props) {
      return () => (
        <ImageUpload maxNumber={props.maxNumber} multiple={props.multiple} />
      );
    },
  });
}
