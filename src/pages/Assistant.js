import axios from "axios"

import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
    TextContent,
    Text,
    TextArea,
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

function Assistant() {
    const { assistantId } = useParams()

    const [assistantInfo, setassistantInfo] = useState({id: '', name: '', description: '', system_prompt: '', model: '', filenames: []})
    const [modalassistantInfo, setModalassistantInfo] = useState({id: '', name: '', description: '', system_prompt: '', model: '', filenames: []})

    const navigate = useNavigate()

    const [isModalOpen, setModalOpen] = React.useState(false);
    const handleModalToggle = (_event) => {
      if (!isModalOpen) {
        // Reset modal state to current assistant info when opening
        setModalassistantInfo({...assistantInfo});
      }
      setModalOpen(!isModalOpen);
    };

    useEffect(() => {
        getassistantInfo();
      }, []);

    const getassistantInfo = () => {
        axios.get(`/api/assistants/${assistantId}`)
          .then(response => {
            setassistantInfo(response.data)
            setModalassistantInfo(response.data)
          })
          .catch(error => {
            console.error('Error fetching assistants:', error);
          });
    };

    const updateassistant = () => {
        const { name, description, system_prompt, model } = modalassistantInfo;
        axios.put(`/api/assistants/${assistantId}`, {
            "name": name,
            "description": description,
            "system_prompt": system_prompt,
            "model": model
        })
        .then(() => {
            getassistantInfo();
        })
        .catch(error => {
            console.error('Error updating assistant:', error);
        })
    }

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setModalassistantInfo({
            ...modalassistantInfo,
            [name]: files ? files[0] : value          
        })
    }

    const confirmHandler = () => {
        updateassistant();
        handleModalToggle();
    }

    const uploadFile = (assistant) => {
        const file = assistant.target.files[0];
        const formData = new FormData();
        formData.append("file", file);
        axios.post(`/api/assistants/${assistantId}/documents`, formData)
          .then(() =>
          getassistantInfo()
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
                    <Text component={TextVariants.h2}>Assistant Name</Text>
                    <Text component={TextVariants.p}>{assistantInfo.name}</Text>
                </TextContent>
                <TextContent>
                    <Text component={TextVariants.h2}>Description</Text>
                    <Text component={TextVariants.p}>{assistantInfo.description}</Text>
                </TextContent>
                <TextContent>
                    <Text component={TextVariants.h2}>Model</Text>
                    <Text component={TextVariants.p}>{assistantInfo.model}</Text>
                </TextContent>
                <TextContent>
                    <Text component={TextVariants.h2}>System Prompt</Text>
                    <Text component={TextVariants.p}>{assistantInfo.system_prompt}</Text>
                </TextContent>
                <TextContent>
                    <Text component={TextVariants.h2}>Uploaded File(s)</Text>
                    { assistantInfo.filenames.length === 0 && <Text component={TextVariants.p}>No files uploaded.</Text> }
                </TextContent>
                <Panel isScrollable>
                    <PanelMain tabIndex={0}>
                        <PanelMainBody>
                            <List>
                                {
                                    assistantInfo.filenames.map(filename => <ListItem key={filename}>{filename}</ListItem>)
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
                    id={assistantId}
                    type="file"
                    name="file"
                    onChange={uploadFile}
                />
                <div style={{"display": "flex", "flexDirection": "row", "justifyContent": "space-between", "width": "25rem"}}>
                    <Button variant="primary" onClick={handleModalToggle}>Modify assistant Info</Button>
                    <Button variant="warning" onClick={() => navigate(`/${assistantId}/chat`)}>Chat With {assistantInfo.name}</Button>
                </div>
            </div>
            <Modal
                variant={ModalVariant.small}
                title="Update assistant"
                description="Modify the information below to update the assistant."
                isOpen={isModalOpen}
                onClose={handleModalToggle}
                actions={[
                  <Button key="addassistant" variant="primary" form="add-assistant-button" onClick={confirmHandler}>
                    Confirm
                  </Button>,
                  <Button key="cancel" variant="link" onClick={handleModalToggle}>
                    Cancel
                  </Button>
                ]}
              >
                  <Form>
                    <FormGroup>
                      <FormGroup label="Assistant Name" isRequired>
                        <TextInput id="name" isRequired type="text" name="name" value={modalassistantInfo.name} onChange={handleChange}/>
                      </FormGroup>

                      <FormGroup label="Assistant Description" isRequired>
                        <TextInput id="description" isRequired type="text" name="description" value={modalassistantInfo.description} onChange={handleChange} />
                      </FormGroup>

                      <FormGroup label="Model" isRequired>
                        <TextInput id="model" isRequired type="text" name="model" value={modalassistantInfo.model} onChange={handleChange} />
                      </FormGroup>

                      <FormGroup label="System Prompt" isRequired>
                        <TextArea id="prompt" isRequired autoResize resizeOrientation="vertical" type="text" name="system_prompt" value={modalassistantInfo.system_prompt} onChange={handleChange} />
                      </FormGroup>
                    </FormGroup>
                  </Form>
              </Modal>
        </div>
    )
}

export default Assistant
