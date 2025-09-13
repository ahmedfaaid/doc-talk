import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatView from './components/chat-view';
import Layout from './components/layout';
import NoDirectory from './components/no-directory';
import FilesPage from './pages/files';
import { SelectedDirectoryContext } from './context/directory-dialog';

function App() {
  const { directory, indexed } = useContext(SelectedDirectoryContext);

  return (
    <Router>
      <Layout>
        {directory && indexed ? (
          <Routes>
            <Route path="/" element={<ChatView />} />
            <Route path="/files" element={<FilesPage />} />
          </Routes>
        ) : (
          <NoDirectory />
        )}
      </Layout>
    </Router>
  );
}

export default App;
