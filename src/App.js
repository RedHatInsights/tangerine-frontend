import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import assistant from "./pages/assistant"
import Chat from "./pages/Chat"
import Header from "./components/Header"


function App() {
    return (
        <>
            <Header/>
            <Routes>
                <Route path="/" element={ <Home/> } />
                <Route path="/:assistantId" element={ <assistant/> }/>
                <Route path="/:assistantId/chat" element={ <Chat/> } />
            </Routes>
        </>
    )
}

export default App
