import { useContext } from 'react';
import ChatView from './components/chat-view';
import Layout from './components/layout';
import NoDirectory from './components/no-directory';
import { SelectedDirectoryContext } from './context/directory-dialog';

function App() {
  const { directory } = useContext(SelectedDirectoryContext);

  return <Layout>{directory ? <ChatView /> : <NoDirectory />}</Layout>;
}

export default App;
