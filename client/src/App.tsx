import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useState } from 'react';

function App() {
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(
    null
  );
  const [indexingStatus, setIndexingStatus] = useState<string | null>(null);

  const handleSelectDirectory = async () => {
    const directory = await open({
      multiple: false,
      directory: true
    });

    if (directory) {
      setSelectedDirectory(directory);
    } else {
      setSelectedDirectory(null);
    }
  };

  const handleIndexDirectory = async () => {
    if (selectedDirectory) {
      const status = await invoke<string>('index_directory', {
        path: selectedDirectory
      });
      setIndexingStatus(status);
    }
  };
  return (
    <div>
      <h1>Doc Talk</h1>
      <div>
        <button onClick={handleSelectDirectory}>
          Select a folder to index
        </button>
        {selectedDirectory && (
          <div>
            <p>Selected folder: {selectedDirectory}</p>
            <button onClick={handleIndexDirectory}>Index folder</button>
          </div>
        )}
      </div>
      {indexingStatus && <p>Status: {indexingStatus}</p>}
    </div>
  );
}

export default App;
