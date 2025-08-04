import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
} from "@patternfly/react-core";
import AngleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-left-icon";

function KnowledgeBase() {
    const { knowledgeBaseId } = useParams();

    const [kbInfo, setKbInfo] = useState({id: '', name: '', description: '', filenames: []});
    const [modalKbInfo, setModalKbInfo] = useState({id: '', name: '', description: ''});

    const navigate = useNavigate();

    const [isModalOpen, setModalOpen] = React.useState(false);
    const handleModalToggle = (_event) => {
      if (!isModalOpen) {
        setModalKbInfo({...kbInfo});
      }
      setModalOpen(!isModalOpen);
    };

    useEffect(() => {
        getKbInfo();
    }, []);

    const getKbInfo = () => {
        axios.get(`/api/knowledgebases/${knowledgeBaseId}`)
          .then(response => {
            setKbInfo(response.data);
            setModalKbInfo(response.data);
          })
          .catch(error => {
            console.error('Error fetching knowledge base:', error);
          });
    };

    const updateKb = () => {
        const { name, description } = modalKbInfo;
        axios.put(`/api/knowledgebases/${knowledgeBaseId}`, {
            "name": name,
            "description": description
        })
        .then(() => {
            getKbInfo();
        })
        .catch(error => {
            console.error('Error updating knowledge base:', error);
        })
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setModalKbInfo({
            ...modalKbInfo,
            [name]: value          
        });
    };

    const confirmHandler = () => {
        updateKb();
        handleModalToggle();
    };

    const uploadFile = (event) => {
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append("file", file);
        axios.post(`/api/knowledgebases/${knowledgeBaseId}/documents`, formData)
          .then(() => getKbInfo())
          .catch(error => {
            console.error('Error uploading file:', error);
          });
    };

    const deleteDocument = (filename) => {
        axios.delete(`/api/knowledgebases/${knowledgeBaseId}/documents`, {
            data: { filename: filename }
        })
        .then(() => getKbInfo())
        .catch(error => {
            console.error('Error deleting document:', error);
        });
    };

    return(
        <div style={{"marginLeft": "2.5rem"}}>
            <div style={{"paddingTop": "1rem", "paddingBottom": "2rem"}}>
                <Button variant="secondary" icon={<AngleLeftIcon/>} onClick={() => navigate("/knowledgebases")}>Back to Knowledge Bases</Button>
            </div>
            <TextContent style={{"display": "flex", "flexDirection": "column", "justifyContent": "space-around", "height": "35rem"}}>
                <TextContent>
                    <Text component={TextVariants.h2}>Knowledge Base Name</Text>
                    <Text component={TextVariants.p}>{kbInfo.name}</Text>
                </TextContent>
                <TextContent>
                    <Text component={TextVariants.h2}>Description</Text>
                    <Text component={TextVariants.p}>{kbInfo.description}</Text>
                </TextContent>
                <TextContent>
                    <Text component={TextVariants.h2}>Uploaded Documents</Text>
                    { kbInfo.filenames && kbInfo.filenames.length === 0 && <Text component={TextVariants.p}>No documents uploaded.</Text> }
                </TextContent>
                <Panel isScrollable>
                    <PanelMain tabIndex={0}>
                        <PanelMainBody>
                            <List>
                                {
                                    kbInfo.filenames && kbInfo.filenames.map(filename => (
                                        <ListItem key={filename} style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center"}}>
                                            <span>{filename}</span>
                                            <Button variant="danger" size="sm" onClick={() => deleteDocument(filename)}>
                                                Delete
                                            </Button>
                                        </ListItem>
                                    ))
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
                    id={knowledgeBaseId}
                    type="file"
                    name="file"
                    onChange={uploadFile}
                />
                <div style={{"display": "flex", "flexDirection": "row", "justifyContent": "flex-start", "width": "25rem"}}>
                    <Button variant="primary" onClick={handleModalToggle}>Modify Knowledge Base Info</Button>
                </div>
            </div>
            <Modal
                variant={ModalVariant.small}
                title="Update knowledge base"
                description="Modify the information below to update the knowledge base."
                isOpen={isModalOpen}
                onClose={handleModalToggle}
                actions={[
                  <Button key="updatekb" variant="primary" onClick={confirmHandler}>
                    Confirm
                  </Button>,
                  <Button key="cancel" variant="link" onClick={handleModalToggle}>
                    Cancel
                  </Button>
                ]}
              >
                  <Form>
                    <FormGroup>
                      <FormGroup label="Knowledge Base Name" isRequired>
                        <TextInput id="name" isRequired type="text" name="name" value={modalKbInfo.name} onChange={handleChange}/>
                      </FormGroup>

                      <FormGroup label="Description" isRequired>
                        <TextArea id="description" isRequired name="description" value={modalKbInfo.description} onChange={handleChange} autoResize resizeOrientation="vertical" />
                      </FormGroup>
                    </FormGroup>
                  </Form>
              </Modal>
        </div>
    );
}

export default KnowledgeBase;