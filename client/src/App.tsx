import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useState } from 'react';
import Layout from './components/layout';

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
    <Layout>
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
    </Layout>
  );
}

export default App;
