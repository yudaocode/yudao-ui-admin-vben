export function checkFileType(file: File, accepts: string[]) {
  let reg;
  if (!accepts || accepts.length === 0) {
    reg = /.(jpg|jpeg|png|gif|webp)$/i;
  } else {
    const newTypes = accepts.join('|');
    reg = new RegExp('\\.(' + newTypes + ')$', 'i');
  }
  return reg.test(file.name);
}

export function checkImgType(file: File) {
  return isImgTypeByName(file.name);
}

export function isImgTypeByName(name: string) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
}
