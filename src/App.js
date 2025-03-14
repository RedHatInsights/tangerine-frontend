import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Assistant from "./pages/Assistant"
import Chat from "./pages/Chat"
import Header from "./components/Header"


function App() {
    return (
        <>
            <Header/>
            <Routes>
                <Route path="/" element={ <Home/> } />
                <Route path="/:assistantId" element={ <Assistant/> }/>
                <Route path="/:assistantId/chat" element={ <Chat/> } />
            </Routes>
        </>
    )
}

export default App
