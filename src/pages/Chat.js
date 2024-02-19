import { useParams } from "react-router-dom"

function Chat() {
    const { agentId } = useParams()

    return (
        <>
            <h1>Chat with Agent: {agentId}</h1>
        </>
    )
}

export default Chat
