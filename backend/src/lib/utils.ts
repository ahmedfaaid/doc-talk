import { UPLOAD_DIR } from './constants';

export const getLastPathSegment = (path: string): string => {
  return path.substring(path.lastIndexOf('/') + 1);
};

export const createVectorStorePath = (name: string) => {
  return `vectorstore/${name}`;
};

export const createUploadFilePath = (name: string, userId: string) => {
  return `${UPLOAD_DIR}/${userId}-${name}`;
};
