import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  TextContent,
  Text,
  TextVariants,
  TextInput,
} from "@patternfly/react-core";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SearchInfo from "../components/SearchInfo";
import { Button } from "@patternfly/react-core";
import React from "react";

function Chat() {
  const { assistantId } = useParams();
  const [assistantInfo, setassistantInfo] = useState({
    name: "",
    description: "",
  });
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [interactionsGivenFeedback, setInteractionsGivenFeedback] = useState(
    []
  );

  useEffect(() => {
    // Generate a new session ID when the component mounts
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
  }, []);

  const addMessage = (sender, message, done = false) => {
    const messageToAdd = { sender: sender, text: message, done: done };
    setMessages((prevMessages) => [...prevMessages, messageToAdd]);
  };

  const handleChatKeyDown = (event) => {
    if (event.key == "Enter" && chatInput.length > 0) {
      addMessage("human", chatInput);
      setChatInput("");
      sendChatMessage();
    }
  };

  useEffect(() => {
    getassistantInfo();
  }, []);

  const vote = (message, upvote, downvote) => {
    return async () => {
      const response = await fetch(`/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interactionId: message.interactionId,
          like: upvote,
          dislike: downvote,
          feedback: "",
        }),
      });
      const data = await response.json();
      setInteractionsGivenFeedback((prev) => {
        return [...prev, message.interactionId];
      });
      console.log(data);
    };
  };

  const getassistantInfo = () => {
    axios
      .get(`/api/assistants/${assistantId}`)
      .then((response) => {
        setassistantInfo(response.data);
      })
      .catch((error) => {
        console.error("Error fetching assistants:", error);
      });
  };

  const interactionHasFeedback = (interactionId) => {
    return interactionsGivenFeedback.includes(interactionId);
  };

  const sendChatMessage = async () => {
    // Make a POST request with streaming response
    const response = await fetch(`/api/assistants/${assistantId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: chatInput,
        prevMsgs: messages,
        stream: "true",
        client: "tangerine-frontend",
        interactionId: crypto.randomUUID(),
        sessionId: sessionId,
      }),
    });

    const reader = response.body
      .pipeThrough(new TextDecoderStream("utf-8"))
      .getReader();

    while (true) {
      const chunk = await reader.read();
      const { done, value } = chunk;

      if (done) {
        break;
      }

      const matches = [...value.matchAll(/data: (\{.*\})\r\n/g)];

      for (const match of matches) {
        const jsonString = match[1];
        const { text_content, search_metadata } = JSON.parse(jsonString);
        if (text_content || search_metadata) {
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            if (lastMessage.sender !== "ai") {
              const newMessage = {
                sender: "ai",
                text: text_content,
                done: false,
              };
              return [...prevMessages, newMessage];
            }

            const updatedMessages = [...prevMessages];

            if (text_content) {
              updatedMessages[updatedMessages.length - 1].text += text_content;
            }

            if (search_metadata) {
              updatedMessages[updatedMessages.length - 1].search_metadata =
                search_metadata;
              // search_metadata arrives from API at the end of the text content stream
              updatedMessages[updatedMessages.length - 1].done = true;
              updatedMessages[updatedMessages.length - 1].interactionId =
                search_metadata[0].interactionId;
            }

            return updatedMessages;
          });
        }
      }
    }
  };

  return (
    <>
      <TextContent
        style={{
          marginLeft: "10rem",
          paddingTop: "2rem",
          paddingBottom: "2rem",
        }}
      >
        <Text component={TextVariants.h1}>
          Chat with {assistantInfo.name}
        </Text>
        <Text component={TextVariants.p}>{assistantInfo.description}</Text>
        <Text component={TextVariants.p}>Session ID: {sessionId}</Text>
      </TextContent>
      <div>
        <div
          className="pf-v5-c-panel pf-m-scrollable"
          style={{
            marginLeft: "10rem",
            marginRight: "15rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
          }}
        >
          <div className="pf-v5-c-panel__main" style={{ minHeight: "70vh" }}>
            <div className="pf-v5-c-panel__main-body">
              {messages &&
                messages.map((message, index) => (
                  <TextContent key={index} style={{ paddingBottom: "1rem" }}>
                    <Text component={TextVariants.h3}>
                      {message.sender === "ai"
                        ? assistantInfo.name
                        : message.sender}
                    </Text>
                    <Text component={TextVariants.small}>
                      {message.sender === "ai"
                        ? `Interaction ID: ${message.interactionId}`
                        : ""}
                    </Text>
                    {/* do not format as markdown until text content streaming is finished */}
                    {message.done ? (
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {message.text}
                      </Markdown>
                    ) : (
                      <Text>{message.text}</Text>
                    )}
                    {message.sender === "ai" && message.search_metadata && (
                      <SearchInfo searchData={message.search_metadata} />
                    )}
                    {message.sender === "ai" &&
                      message.done &&
                      !interactionHasFeedback(message.interactionId) && (
                        <React.Fragment>
                          <Button
                            size="sm"
                            onClick={vote(message, true, false)}
                          >
                            Upvote
                          </Button>
                          <Button
                            size="sm"
                            onClick={vote(message, false, true)}
                          >
                            Downvote
                          </Button>
                        </React.Fragment>
                      )}
                    {message.sender === "ai" &&
                      message.done &&
                      interactionHasFeedback(message.interactionId) && (
                        <Text component={TextVariants.small}>
                          Thank you for your feedback!
                        </Text>
                      )}
                  </TextContent>
                ))}
            </div>
          </div>
          <div className="pf-v5-c-panel__footer" style={{ width: "100%" }}>
            <TextInput
              type="text"
              value={chatInput}
              id="assistant-chat-input"
              name="assistant-chat-input"
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder="Write a message to the assistant. Press ENTER to send..."
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Chat;
