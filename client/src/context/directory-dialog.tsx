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
}

export const SelectedDirectoryContext = createContext<SelectedDirectoryState>({
  directory: null,
  setDirectory: () => {} // Placeholder function to satisfy TypeScript's type checking. Replace with actual implementation.
});

export default function SelectedDirectoryProvider({
  children
}: {
  children: ReactNode;
}) {
  const [directory, setDirectory] = useState<string | null>(null);

  useEffect(() => {
    const checkIndexedDirectory = async () => {
      try {
        const indexedDirectory: any = await invoke(
          'retrieve_indexed_directory'
        );

        setDirectory(indexedDirectory.directories[0].name);
      } catch (error) {
        setDirectory(null);
      }
    };

    checkIndexedDirectory();
  }, []);

  return (
    <SelectedDirectoryContext.Provider value={{ directory, setDirectory }}>
      {children}
    </SelectedDirectoryContext.Provider>
  );
}
