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
    DualListSelector,
    DualListSelectorPane,
    DualListSelectorList,
    DualListSelectorListItem,
    DualListSelectorControlsWrapper,
    DualListSelectorControl,
} from "@patternfly/react-core";
import AngleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-left-icon";
import AngleDoubleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-double-left-icon";
import AngleDoubleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-double-right-icon";
import AngleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-right-icon";

function Assistant() {
    const { assistantId } = useParams();

    const [assistantInfo, setAssistantInfo] = useState({
        id: '',
        name: '',
        description: '',
        system_prompt: '',
        model: '',
        knowledgebases: []
    });
    const [modalAssistantInfo, setModalAssistantInfo] = useState({
        id: '',
        name: '',
        description: '',
        system_prompt: '',
        model: ''
    });

    const [allKnowledgeBases, setAllKnowledgeBases] = useState([]);
    const [availableKBs, setAvailableKBs] = useState([]);
    const [assignedKBs, setAssignedKBs] = useState([]);
    const [isKBModalOpen, setKBModalOpen] = useState(false);

    const navigate = useNavigate();

    const [isModalOpen, setModalOpen] = React.useState(false);
    const handleModalToggle = (_event) => {
        if (!isModalOpen) {
            setModalAssistantInfo({...assistantInfo});
        }
        setModalOpen(!isModalOpen);
    };

    const handleKBModalToggle = () => {
        if (!isKBModalOpen) {
            loadKnowledgeBasesForSelection();
        }
        setKBModalOpen(!isKBModalOpen);
    };

    useEffect(() => {
        getAssistantInfo();
    }, []);

    const getAssistantInfo = () => {
        axios.get(`/api/assistants/${assistantId}`)
            .then(response => {
                setAssistantInfo(response.data);
                setModalAssistantInfo(response.data);
            })
            .catch(error => {
                console.error('Error fetching assistant:', error);
            });
    };

    const loadKnowledgeBasesForSelection = () => {
        // Load all knowledge bases
        axios.get('/api/knowledgebases')
            .then(response => {
                const allKBs = response.data.data || response.data;
                setAllKnowledgeBases(allKBs);

                // Load currently assigned knowledge bases
                return axios.get(`/api/assistants/${assistantId}/knowledgebases`)
                    .then(assignedResponse => {
                        const assigned = assignedResponse.data.data || assignedResponse.data;
                        const assignedIds = assigned.map(kb => kb.id);

                        setAssignedKBs(assigned.map(kb => ({
                            id: kb.id,
                            text: kb.name,
                            selected: false,
                            isVisible: true
                        })));

                        setAvailableKBs(allKBs
                            .filter(kb => !assignedIds.includes(kb.id))
                            .map(kb => ({
                                id: kb.id,
                                text: kb.name,
                                selected: false,
                                isVisible: true
                            }))
                        );
                    });
            })
            .catch(error => {
                console.error('Error loading knowledge bases:', error);
            });
    };

    const updateAssistant = () => {
        const { name, description, system_prompt, model } = modalAssistantInfo;
        axios.put(`/api/assistants/${assistantId}`, {
            "name": name,
            "description": description,
            "system_prompt": system_prompt,
            "model": model
        })
        .then(() => {
            getAssistantInfo();
        })
        .catch(error => {
            console.error('Error updating assistant:', error);
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setModalAssistantInfo({
            ...modalAssistantInfo,
            [name]: value
        });
    };

    const confirmHandler = () => {
        updateAssistant();
        handleModalToggle();
    };

    const saveKnowledgeBaseAssignments = () => {
        const newIds = assignedKBs.map(kb => kb.id);
        
        // Send all knowledge base IDs in a single request
        axios.post(`/api/assistants/${assistantId}/knowledgebases`, {
            knowledgebase_ids: newIds
        })
        .then(() => {
            getAssistantInfo();
            handleKBModalToggle();
        })
        .catch(error => {
            console.error('Error updating knowledge base assignments:', error);
        });
    };

    const moveSelected = (fromAvailable) => {
        const sourceOptions = fromAvailable ? availableKBs : assignedKBs;
        const destinationOptions = fromAvailable ? assignedKBs : availableKBs;

        for (let i = 0; i < sourceOptions.length; i++) {
            const option = sourceOptions[i];
            if (option.selected && option.isVisible) {
                sourceOptions.splice(i, 1);
                destinationOptions.push(option);
                option.selected = false;
                i--;
            }
        }

        if (fromAvailable) {
            setAvailableKBs([...sourceOptions]);
            setAssignedKBs([...destinationOptions]);
        } else {
            setAssignedKBs([...sourceOptions]);
            setAvailableKBs([...destinationOptions]);
        }
    };

    const moveAll = (fromAvailable) => {
        if (fromAvailable) {
            setAssignedKBs([...availableKBs.filter(option => option.isVisible), ...assignedKBs]);
            setAvailableKBs([...availableKBs.filter(option => !option.isVisible)]);
        } else {
            setAvailableKBs([...assignedKBs.filter(option => option.isVisible), ...availableKBs]);
            setAssignedKBs([...assignedKBs.filter(option => !option.isVisible)]);
        }
    };

    const onOptionSelect = (event, index, isChosen) => {
        if (isChosen) {
            const newChosen = [...assignedKBs];
            newChosen[index].selected = !assignedKBs[index].selected;
            setAssignedKBs(newChosen);
        } else {
            const newAvailable = [...availableKBs];
            newAvailable[index].selected = !availableKBs[index].selected;
            setAvailableKBs(newAvailable);
        }
    };

    return(
        <div style={{"marginLeft": "2.5rem"}}>
            <div style={{"paddingTop": "1rem", "paddingBottom": "2rem"}}>
                <Button variant="secondary" icon={<AngleLeftIcon/>} onClick={() => navigate("/")}>Back to Assistants</Button>
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
                    <Text component={TextVariants.h2}>Associated Knowledge Bases</Text>
                    { assistantInfo.knowledgebases && assistantInfo.knowledgebases.length === 0 &&
                      <Text component={TextVariants.p}>No knowledge bases associated.</Text> }
                </TextContent>
                <Panel isScrollable>
                    <PanelMain tabIndex={0}>
                        <PanelMainBody>
                            <List>
                                {
                                    assistantInfo.knowledgebases && assistantInfo.knowledgebases.map(kb => (
                                        <ListItem key={kb.id}>{kb.name}</ListItem>
                                    ))
                                }
                            </List>
                        </PanelMainBody>
                    </PanelMain>
                </Panel>
            </TextContent>
            <div style={{"display": "flex", "flexDirection": "column", "height": "7rem", "justifyContent": "space-around"}}>
                <div style={{"display": "flex", "flexDirection": "row", "justifyContent": "space-between", "width": "35rem"}}>
                    <Button variant="primary" onClick={handleModalToggle}>Modify Assistant Info</Button>
                    <Button variant="secondary" onClick={handleKBModalToggle}>Manage Knowledge Bases</Button>
                    <Button variant="warning" onClick={() => navigate(`/assistants/${assistantId}/chat`)}>Chat With {assistantInfo.name}</Button>
                </div>
            </div>

            {/* Assistant Info Modal */}
            <Modal
                variant={ModalVariant.small}
                title="Update assistant"
                description="Modify the information below to update the assistant."
                isOpen={isModalOpen}
                onClose={handleModalToggle}
                actions={[
                  <Button key="updateassistant" variant="primary" onClick={confirmHandler}>
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
                            <TextInput id="name" isRequired type="text" name="name" value={modalAssistantInfo.name} onChange={handleChange}/>
                        </FormGroup>

                        <FormGroup label="Assistant Description" isRequired>
                            <TextInput id="description" isRequired type="text" name="description" value={modalAssistantInfo.description} onChange={handleChange} />
                        </FormGroup>

                        <FormGroup label="Model" isRequired>
                            <TextInput id="model" isRequired type="text" name="model" value={modalAssistantInfo.model} onChange={handleChange} />
                        </FormGroup>

                        <FormGroup label="System Prompt" isRequired>
                            <TextArea id="prompt" isRequired autoResize resizeOrientation="vertical" type="text" name="system_prompt" value={modalAssistantInfo.system_prompt} onChange={handleChange} />
                        </FormGroup>
                    </FormGroup>
                </Form>
            </Modal>

            {/* Knowledge Base Assignment Modal */}
            <Modal
                variant={ModalVariant.large}
                title="Manage Knowledge Base Associations"
                description="Select which knowledge bases this assistant should have access to."
                isOpen={isKBModalOpen}
                onClose={handleKBModalToggle}
                actions={[
                  <Button key="savekb" variant="primary" onClick={saveKnowledgeBaseAssignments}>
                    Save Changes
                  </Button>,
                  <Button key="cancel" variant="link" onClick={handleKBModalToggle}>
                    Cancel
                  </Button>
                ]}
            >
                <DualListSelector>
                    <DualListSelectorPane
                        title="Available Knowledge Bases"
                        status={`${availableKBs.filter(option => option.selected && option.isVisible).length} of ${availableKBs.filter(option => option.isVisible).length} options selected`}
                    >
                        <DualListSelectorList>
                            {availableKBs.map((option, index) =>
                                option.isVisible ? (
                                    <DualListSelectorListItem
                                        key={option.id}
                                        isSelected={option.selected}
                                        id={`available-option-${index}`}
                                        onOptionSelect={e => onOptionSelect(e, index, false)}
                                    >
                                        {option.text}
                                    </DualListSelectorListItem>
                                ) : null
                            )}
                        </DualListSelectorList>
                    </DualListSelectorPane>

                    <DualListSelectorControlsWrapper>
                        <DualListSelectorControl
                            isDisabled={!availableKBs.some(option => option.selected)}
                            onClick={() => moveSelected(true)}
                            aria-label="Add selected"
                        >
                            <AngleRightIcon />
                        </DualListSelectorControl>
                        <DualListSelectorControl
                            isDisabled={availableKBs.length === 0}
                            onClick={() => moveAll(true)}
                            aria-label="Add all"
                        >
                            <AngleDoubleRightIcon />
                        </DualListSelectorControl>
                        <DualListSelectorControl
                            isDisabled={assignedKBs.length === 0}
                            onClick={() => moveAll(false)}
                            aria-label="Remove all"
                        >
                            <AngleDoubleLeftIcon />
                        </DualListSelectorControl>
                        <DualListSelectorControl
                            onClick={() => moveSelected(false)}
                            isDisabled={!assignedKBs.some(option => option.selected)}
                            aria-label="Remove selected"
                        >
                            <AngleLeftIcon />
                        </DualListSelectorControl>
                    </DualListSelectorControlsWrapper>

                    <DualListSelectorPane
                        title="Associated Knowledge Bases"
                        status={`${assignedKBs.filter(option => option.selected && option.isVisible).length} of ${assignedKBs.filter(option => option.isVisible).length} options selected`}
                        isChosen
                    >
                        <DualListSelectorList>
                            {assignedKBs.map((option, index) =>
                                option.isVisible ? (
                                    <DualListSelectorListItem
                                        key={option.id}
                                        isSelected={option.selected}
                                        id={`chosen-option-${index}`}
                                        onOptionSelect={e => onOptionSelect(e, index, true)}
                                    >
                                        {option.text}
                                    </DualListSelectorListItem>
                                ) : null
                            )}
                        </DualListSelectorList>
                    </DualListSelectorPane>
                </DualListSelector>
            </Modal>
        </div>
    );
}

export default Assistant;
