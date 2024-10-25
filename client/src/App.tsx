import { useContext } from 'react';
import Layout from './components/layout';
import NoDirectory from './components/no-directory';
import { SelectedDirectoryContext } from './context/directory-dialog';

function App() {
  const { directory } = useContext(SelectedDirectoryContext);

  return (
    <Layout>
      {directory ? (
        <div>
          <p>Chat view</p>
        </div>
      ) : (
        <NoDirectory />
      )}
    </Layout>
  );
}

export default App;
