export const getLastPathSegment = (path: string): string => {
  return path.substring(path.lastIndexOf('/') + 1);
};

export const createVectorStorePath = (name: string) => {
  return `vectorstore/${name}`;
};
