import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Assistant from './pages/Assistant';
import Chat from './pages/Chat';
import KnowledgeBases from './pages/KnowledgeBases';
import KnowledgeBase from './pages/KnowledgeBase';
import Header from './components/Header';

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/knowledgebases" element={<KnowledgeBases />} />
        <Route
          path="/knowledgebases/:knowledgeBaseId"
          element={<KnowledgeBase />}
        />
        <Route path="/assistants/:assistantId" element={<Assistant />} />
        <Route path="/assistants/:assistantId/chat" element={<Chat />} />
      </Routes>
    </>
  );
}

export default App;
