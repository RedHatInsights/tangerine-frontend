import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import { TextContent, Text, TextVariants, TextInput } from "@patternfly/react-core"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import SearchInfo from "../components/SearchInfo"

function Chat() {
    const { agentId } = useParams()
    const [agentInfo, setAgentInfo] = useState({agent_name: '', description: ''})
    const [messages, setMessages] = useState([])
    const [chatInput, setChatInput] = useState('')

    const addMessage = (sender, message) => {
        const messageToAdd = {sender: sender, text: message}
        setMessages(prevMessages => [...prevMessages, messageToAdd])
    }

    const handleChatKeyDown = (event) => {
        if (event.key == 'Enter' && chatInput.length > 0) {
            addMessage('human', chatInput)
            setChatInput('')
            sendChatMessage()
        }
    }

    useEffect(() => {
        getAgentInfo();
      }, []);

    const getAgentInfo = () => {
        axios.get(`/api/agents/${agentId}`)
          .then(response => {
            setAgentInfo(response.data)
          })
          .catch(error => {
            console.error('Error fetching agents:', error);
          });
    };

    const sendChatMessage = async () => {
        // Make a POST request with streaming response
        const response = await fetch(`/api/agents/${agentId}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query: chatInput,
                prevMsgs: messages,
                stream: "true",
            })
        })

        const reader = response.body.pipeThrough(new TextDecoderStream("utf-8")).getReader();
        while(true) {
            const chunk = await reader.read();
            const {done, value} = chunk;

            if (done) {
                break;
            }

            // const decodedChunk = decoder.decode(value)
            const lines = value.split("\n");

            const parsedLines = lines.map((line) => {
                if (line.length > 0) {
                    return JSON.parse(line)
                }
                return {text_content: '\n'}
            })

            for (const parsedLine of parsedLines) {
                const { text_content, search_metadata } = parsedLine;
                if (text_content || search_metadata) {
                    setMessages((prevMessages) => {
                        const lastMessage = prevMessages[prevMessages.length - 1]
                        if (lastMessage.sender !== "ai") {
                            const newMessage = {sender: "ai", text: text_content}
                            return [...prevMessages, newMessage]
                        }
                        const updatedMessages = [...prevMessages];
                        if (text_content) {
                            updatedMessages[updatedMessages.length - 1].text += text_content
                        }
                        if (search_metadata) {
                            updatedMessages[updatedMessages.length - 1].search_metadata = search_metadata
                        }
                        
                        return updatedMessages;
                    })
                }
            }
        }
    };


    return (
        <>
            <TextContent style={{"marginLeft": "10rem", "paddingTop": "2rem", "paddingBottom": "2rem"}}>
                <Text component={TextVariants.h1}>Chat with {agentInfo.agent_name}</Text>
                <Text component={TextVariants.p}>{agentInfo.description}</Text>
            </TextContent>
            <div>
                <div className="pf-v5-c-panel pf-m-scrollable" style={{"marginLeft": "10rem", "marginRight": "15rem", "display": "flex", "flexDirection": "column", "justifyContent": "space-around"}}>
                    <div className="pf-v5-c-panel__main" style={{"minHeight": "70vh"}}>
                        <div className="pf-v5-c-panel__main-body">
                            <TextContent id="all-messages">
                                {
                                    messages && messages.map((message, index) => (
                                        <TextContent key={index} style={{"paddingBottom": "1rem"}}>
                                            <Text component={TextVariants.h3}>{message.sender === "ai" ? agentInfo.agent_name : message.sender}</Text>
                                            <Markdown remarkPlugins={[remarkGfm]}>{message.text}</Markdown>
                                            {message.sender === "ai" && <SearchInfo searchData={message.search_metadata}/>}
                                        </TextContent>
                                    ))
                                }
                            </TextContent>
                        </div>
                    </div>
                    <div className="pf-v5-c-panel__footer" style={{"width": "100%"}}>
                        <TextInput
                            type="text"
                            value={chatInput}
                            id="agent-chat-input"
                            name="agent-chat-input"
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={handleChatKeyDown}
                            placeholder="Write a message to the agent. Press ENTER to send..."
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

export default Chat
