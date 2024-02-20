import axios from "axios"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { TextContent, Text, TextVariants, Button, List, ListItem } from "@patternfly/react-core"
import AngleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-left-icon"

function Agent() {
    const { agentId } = useParams()

    const [agentInfo, setAgentInfo] = useState({id: '', agent_name: '', description: '', system_prompt: '', filenames: []})

    const navigate = useNavigate()

    useEffect(() => {
        getAgentInfo();
      }, []);

    const getAgentInfo = () => {
        axios.get(`/agents/${agentId}`)
          .then(response => {
            setAgentInfo(response.data)
          })
          .catch(error => {
            console.error('Error fetching agents:', error);
          });
    };

    const uploadFile = (agent) => {
        const file = agent.target.files[0];
        const formData = new FormData();
        formData.append("file", file);
        axios.post(`/agents/${agentId}/document_upload`, formData)
          .then(() =>
          getAgentInfo()
        )
          .catch(error => {
            console.error('Error uploading file:', error);
          })
      }

    return(
        <div style={{"marginLeft": "2.5rem"}}>
            <div style={{"paddingTop": "1rem"}}>
                <Button variant="secondary" icon={<AngleLeftIcon/>} onClick={() => navigate("/")}>Back</Button>
            </div>
            <TextContent style={{"paddingTop": "2rem", "paddingBottom": "2rem", "display": "flex", "flexDirection": "column", "justifyContent": "space-around", "height": "30rem"}}>
                <TextContent>
                    <Text component={TextVariants.h3}>Agent Name</Text>
                    <Text component={TextVariants.p}>{agentInfo.agent_name}</Text>
                </TextContent>
                <TextContent>
                    <Text component={TextVariants.h3}>Description</Text>
                    <Text component={TextVariants.p}>{agentInfo.description}</Text>
                </TextContent>
                <TextContent>
                    <Text component={TextVariants.h3}>System Prompt</Text>
                    <Text component={TextVariants.p}>{agentInfo.system_prompt}</Text>
                </TextContent>
                <TextContent>
                    <Text component={TextVariants.h3}>Uploaded File(s)</Text>
                    { agentInfo.filenames.length === 0 && <Text component={TextVariants.p}>No files uploaded.</Text> }
                </TextContent>
                <List>
                    {
                        agentInfo.filenames.map(filename => <ListItem>{filename}</ListItem>)
                    }
                </List>
            </TextContent>
            <TextContent>
                    <Text component={TextVariants.p}>Supported file formats: ".md", ".txt" and ".pdf"</Text>
                </TextContent>
            <div style={{"display": "flex", "flexDirection": "column", "height": "7rem", "justifyContent": "space-around"}}>
                <input
                    id={agentId}
                    type="file"
                    name="file"
                    onChange={uploadFile}
                />
                <div>
                    <Button variant="warning" ouiaID="chat" onClick={() => navigate(`/${agentId}/chat`)}>Chat With {agentInfo.agent_name}</Button>
                </div>
            </div>
        </div>
    )
}

export default Agent
