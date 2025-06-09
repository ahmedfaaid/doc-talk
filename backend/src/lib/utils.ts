export const getLastPathSegment = (path: string): string => {
  return path.substring(path.lastIndexOf('/') + 1);
};
