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
        const indexedDirectory: any = await invoke(
          'retrieve_indexed_directory'
        );

        setDirectory(indexedDirectory.directories[0].name);
        setIndexed(true);
      } catch (error) {
        setDirectory(null);
        setIndexed(false);
      }
    };

    checkIndexedDirectory();
  }, []);

  return (
    <SelectedDirectoryContext.Provider
      value={{ directory, setDirectory, indexed, setIndexed }}
    >
      {children}
    </SelectedDirectoryContext.Provider>
  );
}
