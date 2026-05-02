import { defineComponent } from 'vue';

import ImageUpload from '#/components/upload/image-upload.vue';

export function useImagesUpload() {
  return defineComponent({
    name: 'ImagesUpload',
    props: {
      accept: {
        type: Array,
        default: () => ['image/jpeg', 'image/png', 'image/gif'],
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      maxNumber: {
        type: Number,
        default: 5,
      },
      maxSize: {
        type: Number,
        default: 5,
      },
      multiple: {
        type: Boolean,
        default: true,
      },
    },
    setup(props) {
      return () => (
        <ImageUpload
          accept={props.accept as string[]}
          disabled={props.disabled}
          maxNumber={props.maxNumber}
          maxSize={props.maxSize}
          multiple={props.multiple}
        />
      );
    },
  });
}
