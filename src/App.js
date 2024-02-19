import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Agent from "./pages/Agent"
import Chat from "./pages/Chat"


function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={ <Home/> } />
                <Route path="/:agentId" element={ <Agent/> }/>
                <Route path="/:agentId/chat" element={ <Chat/> } />
            </Routes>
        </>
    )
}

export default App
