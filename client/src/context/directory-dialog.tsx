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
  name: string;
  setName: Dispatch<SetStateAction<string>>;
}

export const SelectedDirectoryContext = createContext<SelectedDirectoryState>({
  directory: null,
  setDirectory: () => {},
  indexed: false,
  setIndexed: () => {},
  name: '',
  setName: () => {}
});

export default function SelectedDirectoryProvider({
  children
}: {
  children: ReactNode;
}) {
  const [directory, setDirectory] = useState<string | null>(null);
  const [indexed, setIndexed] = useState<boolean>(false);
  const [name, setName] = useState<string>('');

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
          setName('');
        } else {
          setIndexed(indexedDirectory.directory.indexed ? true : false);
          setName(indexedDirectory.directory.name);
        }
      } catch (error) {
        setIndexed(false);
        setName('');
      }
    };

    checkIndexedDirectory();
  }, [directory]);

  return (
    <SelectedDirectoryContext.Provider
      value={{ directory, setDirectory, indexed, setIndexed, name, setName }}
    >
      {children}
    </SelectedDirectoryContext.Provider>
  );
}
