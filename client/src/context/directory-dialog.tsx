import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
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

  return (
    <SelectedDirectoryContext.Provider value={{ directory, setDirectory }}>
      {children}
    </SelectedDirectoryContext.Provider>
  );
}
