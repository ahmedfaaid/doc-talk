import { ApiResponse } from '@/types';
import { invoke } from '@tauri-apps/api/core';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState
} from 'react';

interface SelectedDirectoryState {
  directory: string | null;
  setDirectory: Dispatch<SetStateAction<string | null>>;
  indexed: boolean;
  setIndexed: Dispatch<SetStateAction<boolean>>;
}

export const SelectedDirectoryContext = createContext<SelectedDirectoryState>({
  directory: null,
  setDirectory: () => {},
  indexed: false,
  setIndexed: () => {}
});

export default function SelectedDirectoryProvider({
  children
}: {
  children: ReactNode;
}) {
  const [directory, setDirectory] = useState<string | null>(null);
  const [indexed, setIndexed] = useState<boolean>(false);

  useEffect(() => {
    const checkIndexedDirectory = async () => {
      try {
        const indexedDirectory: ApiResponse = await invoke(
          'retrieve_indexed_directory',
          {
            directory
          }
        );

        if (indexedDirectory.directory === null) {
          setIndexed(false);
        } else {
          setDirectory(indexedDirectory.directory.name);
          setIndexed(indexedDirectory.directory.indexed ? true : false);
        }
      } catch (error) {
        setIndexed(false);
      }
    };

    checkIndexedDirectory();
  }, [directory]);

  return (
    <SelectedDirectoryContext.Provider
      value={{ directory, setDirectory, indexed, setIndexed }}
    >
      {children}
    </SelectedDirectoryContext.Provider>
  );
}
