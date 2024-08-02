import axios from "axios"

import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
    TextContent,
    Text,
    TextVariants,
    Button,
    List,
    ListItem,
    Panel,
    PanelMain,
    PanelMainBody,
    Modal,
    ModalVariant,
    Form,
    FormGroup,
    TextInput,
} from "@patternfly/react-core"
import AngleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-left-icon"

function Agent() {
    const { agentId } = useParams()

    const [agentInfo, setAgentInfo] = useState({id: '', agent_name: '', description: '', system_prompt: '', filenames: []})
    const [modalAgentInfo, setModalAgentInfo] = useState({id: '', agent_name: '', description: '', system_prompt: '', filenames: []})

    const navigate = useNavigate()

    const [isModalOpen, setModalOpen] = React.useState(false);
    const handleModalToggle = (_event) => {
      setModalOpen(!isModalOpen);
    };

    useEffect(() => {
        getAgentInfo();
      }, []);

    const getAgentInfo = () => {
        axios.get(`/api/agents/${agentId}`)
          .then(response => {
            setAgentInfo(response.data)
            setModalAgentInfo(response.data)
          })
          .catch(error => {
            console.error('Error fetching agents:', error);
          });
    };

    const updateAgent = () => {
        const { agent_name, description, system_prompt } = modalAgentInfo;
        axios.put(`/api/agents/${agentId}`, {
            "agent_name": agent_name,
            "description": description,
            "system_prompt": system_prompt
        })
        .then(() => {
            getAgentInfo();
        })
        .catch(error => {
            console.error('Error updating agent:', error);
        })
    }

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setModalAgentInfo({
            ...modalAgentInfo,
            [name]: files ? files[0] : value
          })
    }

    const confirmHandler = () => {
        updateAgent();
        handleModalToggle();
    }

    const uploadFile = (agent) => {
        const file = agent.target.files[0];
        const formData = new FormData();
        formData.append("file", file);
        axios.post(`/api/agents/${agentId}/document_upload`, formData)
          .then(() =>
          getAgentInfo()
        )
          .catch(error => {
            console.error('Error uploading file:', error);
          })
      }

    return(
        <div style={{"marginLeft": "2.5rem"}}>
            <div style={{"paddingTop": "1rem", "paddingBottom": "2rem"}}>
                <Button variant="secondary" icon={<AngleLeftIcon/>} onClick={() => navigate("/")}>Back</Button>
            </div>
            <TextContent style={{"display": "flex", "flexDirection": "column", "justifyContent": "space-around", "height": "35rem"}}>
                <TextContent>
                    <Text component={TextVariants.h2}>Agent Name</Text>
                    <Text component={TextVariants.p}>{agentInfo.agent_name}</Text>
                </TextContent>
                <TextContent>
                    <Text component={TextVariants.h2}>Description</Text>
                    <Text component={TextVariants.p}>{agentInfo.description}</Text>
                </TextContent>
                <TextContent>
                    <Text component={TextVariants.h2}>System Prompt</Text>
                    <Text component={TextVariants.p}>{agentInfo.system_prompt}</Text>
                </TextContent>
                <TextContent>
                    <Text component={TextVariants.h2}>Uploaded File(s)</Text>
                    { agentInfo.filenames.length === 0 && <Text component={TextVariants.p}>No files uploaded.</Text> }
                </TextContent>
                <Panel isScrollable>
                    <PanelMain tabIndex={0}>
                        <PanelMainBody>
                            <List>
                                {
                                    agentInfo.filenames.map(filename => <ListItem key={filename}>{filename}</ListItem>)
                                }
                            </List>
                        </PanelMainBody>
                    </PanelMain>
                </Panel>
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
                <div style={{"display": "flex", "flexDirection": "row", "justifyContent": "space-between", "width": "25rem"}}>
                    <Button variant="primary" onClick={handleModalToggle}>Modify Agent Info</Button>
                    <Button variant="warning" onClick={() => navigate(`/${agentId}/chat`)}>Chat With {agentInfo.agent_name}</Button>
                </div>
            </div>
            <Modal
                variant={ModalVariant.small}
                title="Update Agent"
                description="Modify the information below to update the agent."
                isOpen={isModalOpen}
                onClose={handleModalToggle}
                actions={[
                  <Button key="addAgent" variant="primary" form="add-agent-button" onClick={confirmHandler}>
                    Confirm
                  </Button>,
                  <Button key="cancel" variant="link" onClick={handleModalToggle}>
                    Cancel
                  </Button>
                ]}
              >
                  <Form>
                    <FormGroup>
                      <FormGroup label="Agent Name" isRequired>
                        <TextInput id="agent_name" isRequired type="text" name="agent_name" value={modalAgentInfo.agent_name} onChange={handleChange}/>
                      </FormGroup>

                      <FormGroup label="Agent Description" isRequired>
                        <TextInput id="description" isRequired type="text" name="description" value={modalAgentInfo.description} onChange={handleChange} />
                      </FormGroup>

                      <FormGroup label="System Prompt" isRequired>
                        <TextInput id="prompt" isRequired type="text" name="system_prompt" value={modalAgentInfo.system_prompt} onChange={handleChange} />
                      </FormGroup>
                    </FormGroup>
                  </Form>
              </Modal>
        </div>
    )
}

export default Agent
