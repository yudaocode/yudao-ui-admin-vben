export function checkFileType(file: File, accepts: string[]) {
  if (!accepts || accepts.length === 0) {
    return true;
  }
  const newTypes = accepts.join('|');
  const reg = new RegExp(`${String.raw`\.(` + newTypes})$`, 'i');
  return reg.test(file.name);
}
