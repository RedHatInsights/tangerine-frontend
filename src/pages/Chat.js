import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import { TextContent, Text, TextVariants, TextInput } from "@patternfly/react-core"

function Chat() {
    const { agentId } = useParams()
    const [agentInfo, setAgentInfo] = useState({agent_name: '', description: ''})
    const [messages, setMessages] = useState([])
    const [chatInput, setChatInput] = useState('')

    const addMessage = (sender, message) => {
        const allMessages = [...messages]
        allMessages.push({sender: sender, text: message})
        setMessages(allMessages)
        console.log(messages);
    }

    const handleChatKeyDown = (event) => {
        if (event.key == 'Enter' && chatInput.length > 0) {
            addMessage('human', chatInput)
            setChatInput('')
            sendChatMessage()
            console.log(chatInput)
            console.log(messages)
        }
    }

    useEffect(() => {
        getAgentInfo();
      }, []);

    const getAgentInfo = () => {
        axios.get(`/agents/${agentId}`)
          .then(response => {
            setAgentInfo(response.data)
            console.log("response:", response.data)
            //  setLoading(false);
          })
          .catch(error => {
            console.error('Error fetching agents:', error);
          });
    };

    const sendChatMessage = async () => {
        // Make a POST request with streaming response
        fetch(`/agents/${agentId}/chat`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            // Add any other headers as needed
            },
            body: JSON.stringify({
                // Add your request payload here if needed
                query: chatInput, stream: "true"
            })
        })
        .then(response => {
            // Check if the response is OK
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            // Get a ReadableStream from the response body
            const reader = response.body.getReader();
        
            // Define a function to read from the stream
            const readStream = () => {
                reader.read().then(({ done, value }) => {
                    // Check if the stream has ended
                    if (done) {
                        console.log('Stream complete');
                        return;
                    }
            
                    // Handle the chunk of data received from the stream
                    console.log('Received chunk:', value);
            
                    // Continue reading from the stream
                    readStream();
                }).catch(error => {
                    console.error('Error reading stream:', error);
                });
            };
        
            // Start reading from the stream
            readStream();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
  
        // const response = axios.post(`/agents/${agentId}/chat`, {query: chatInput, stream: "true"}, {responseType: "stream"})
        
        // const stream = response.data;

        // stream.on('data', data => {
        //     console.log(data);
        // });
        // .then((response) => {
        //     console.log("response: ", response)
        //     // const allMessages = [...messages]
        //     // allMessages.push({sender: "ai", text: response.data.text_content})
        //     // setMessages(allMessages)
        // })
        // .catch(error => {
        //     console.error('Error adding agent:', error);
        // })
    };


    return (
        <>
            <TextContent>
                <Text component={TextVariants.h1}>Chat with {agentInfo.agent_name}</Text>
                <Text component={TextVariants.p}>{agentInfo.description}</Text>
            </TextContent>
            <TextContent id="all-messages">
                {
                    messages.map((message, index) => (
                        <TextContent key={index}>
                            <Text component={TextVariants.h4}>{message.sender}</Text>
                            <Text component={TextVariants.p}>{message.text}</Text>
                        </TextContent>
                    ))
                }
            </TextContent>
            <TextInput
                type="text"
                value={chatInput}
                id="agent-chat-input"
                name="agent-chat-input"
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Write a message to the agent. Press ENTER to send..."
            />
        </>
    )
}

export default Chat
