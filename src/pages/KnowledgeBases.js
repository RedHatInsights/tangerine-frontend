import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Button,
  Form,
  FormGroup,
  TextArea,
  TextInput,
  Panel,
  PanelMain,
  PanelMainBody,
  Title,
  Modal,
  ModalVariant,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { Link, useNavigate } from 'react-router-dom';
import AddCircleIcon from "@patternfly/react-icons/dist/esm/icons/add-circle-o-icon";

const KnowledgeBases = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [knowledgeBaseData, setKnowledgeBaseData] = useState({
    name: '',
    description: ''
  });

  const navigate = useNavigate();

  const [isModalOpen, setModalOpen] = React.useState(false);
  const handleModalToggle = (_event) => {
    if (!isModalOpen) {
      setModalOpen(true);
    } else {
      setModalOpen(false);
      setKnowledgeBaseData({ name: '', description: '' });
    }
  };

  const confirmHandler = () => {
    addKnowledgeBase();
    handleModalToggle();
  };

  useEffect(() => {
    getKnowledgeBases();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setKnowledgeBaseData({
      ...knowledgeBaseData,
      [name]: value
    });
  };

  const getKnowledgeBases = () => {
    axios.get('/api/knowledgebases')
      .then(response => {
        setData(response.data.data || response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching knowledge bases:', error);
        setLoading(false);
      });
  };

  const addKnowledgeBase = () => {
    axios.post('/api/knowledgebases', knowledgeBaseData)
      .then(() => {
        setKnowledgeBaseData({ name: '', description: '' });
        getKnowledgeBases();
      })
      .catch(error => {
        console.error('Error adding knowledge base:', error);
      });
  };

  const deleteKnowledgeBase = (event) => {
    const kbId = event.target.id;
    axios.delete(`/api/knowledgebases/${kbId}`)
      .then(() => getKnowledgeBases())
      .catch(error => {
        console.error('Error deleting knowledge base:', error);
      });
  };

  return (
    <Panel>
      <PanelMain>
        <PanelMainBody>
          {loading ? (
            <p>Loading knowledge bases...</p>
          ) : (
            <div style={{"width": "90%", "display": "flex", "flexDirection": "column", "marginLeft": "2.5rem"}}>
              <div style={{"display": "flex", "justifyContent": "end", "paddingTop": "0.5rem"}}>
                <Button variant="primary" onClick={handleModalToggle} icon={<AddCircleIcon/>}>
                  Add Knowledge Base
                </Button>
              </div>
              <div style={{"marginTop": "2.5rem"}}>
                <Title headingLevel="h1" style={{"paddingBottom": "1.5rem"}}>Knowledge Bases</Title>
                <Table aria-label="Knowledge bases table">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Description</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.map(kb => (
                      <Tr key={kb.id}>
                        <Td><Link to={`/knowledgebases/${kb.id}`}>{kb.name}</Link></Td>
                        <Td>{kb.description}</Td>
                        <Td>
                          <Button 
                            id={kb.id} 
                            onClick={() => navigate(`/knowledgebases/${kb.id}`)} 
                            variant="secondary"
                            style={{"marginRight": "0.5rem"}}
                          >
                            Manage
                          </Button>
                          <Button id={kb.id} onClick={deleteKnowledgeBase} variant="danger">
                            Delete
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </div>
              <Modal
                variant={ModalVariant.medium}
                title="Create a new knowledge base"
                description="Enter the information below to create a new knowledge base."
                isOpen={isModalOpen}
                onClose={handleModalToggle}
                actions={[
                  <Button 
                    key="addkb" 
                    variant="primary" 
                    onClick={confirmHandler}
                    isDisabled={!knowledgeBaseData.name.trim() || !knowledgeBaseData.description.trim()}
                  >
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
                      <TextInput 
                        id="name" 
                        isRequired 
                        type="text" 
                        name="name" 
                        value={knowledgeBaseData.name} 
                        onChange={handleChange}
                      />
                    </FormGroup>
                    <FormGroup label="Description" isRequired>
                      <TextArea 
                        id="description" 
                        isRequired 
                        name="description" 
                        value={knowledgeBaseData.description} 
                        onChange={handleChange}
                        autoResize
                        resizeOrientation="vertical"
                      />
                    </FormGroup>
                  </FormGroup>
                </Form>
              </Modal>
            </div>
          )}
        </PanelMainBody>
      </PanelMain>
    </Panel>
  );
};

export default KnowledgeBases;