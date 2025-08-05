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

import AddCircleIcon from '@patternfly/react-icons/dist/esm/icons/add-circle-o-icon';

const Main = () => {
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(true);
  const [defaultsLoading, setDefaultsLoading] = useState(true);
  const [assistantData, setassistantData] = useState({
    name: '',
    description: '',
    system_prompt: '',
    model: '',
  });

  const navigate = useNavigate();

  const [isModalOpen, setModalOpen] = React.useState(false);
  const handleModalToggle = (_event) => {
    if (!isModalOpen) {
      setModalOpen(true);
      setDefaultsLoading(true);
      axios
        .get('/api/assistantDefaults')
        .then((response) => {
          setassistantData({
            name: '',
            description: '',
            system_prompt: response.data.system_prompt,
            model: response.data.model || '',
          });
          setDefaultsLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching assistant defaults:', error);
        });
    } else {
      setModalOpen(false);
    }
  };

  const isFormValid = () => {
    return (
      assistantData.name &&
      assistantData.description &&
      assistantData.system_prompt
    );
  };

  const confirmHandler = () => {
    addassistant();
    handleModalToggle();
  };

  useEffect(() => {
    getassistants();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setassistantData({
      ...assistantData,
      [name]: value,
    });
  };

  const getassistants = () => {
    axios
      .get('/api/assistants')
      .then((response) => {
        setData(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching assistants:', error);
      });
  };

  const addassistant = () => {
    axios
      .post('/api/assistants', assistantData)
      .then(() => {
        setassistantData({
          name: '',
          description: '',
          system_prompt: '',
          model: '',
        });
        getassistants();
      })
      .catch((error) => {
        console.error('Error adding assistant:', error);
      });
  };

  const deleteassistant = (assistant) => {
    axios
      .delete('/api/assistants/' + assistant.target.id)
      .then(() => getassistants())
      .catch((error) => {
        console.error('Error deleting assistant:', error);
      });
  };

  return (
    <Panel>
      <PanelMain>
        <PanelMainBody>
          {loading ? (
            <p>Loading assistants...</p>
          ) : (
            <div
              style={{
                width: '90%',
                display: 'flex',
                flexDirection: 'column',
                marginLeft: '2.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'end',
                  paddingTop: '0.5rem',
                }}
              >
                <Button
                  variant="primary"
                  onClick={handleModalToggle}
                  icon={<AddCircleIcon />}
                >
                  Add assistant
                </Button>
              </div>
              <div style={{ marginTop: '2.5rem' }}>
                <Title headingLevel="h1" style={{ paddingBottom: '1.5rem' }}>
                  Available assistants
                </Title>
                <Table aria-label="Simple table">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Description</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.map((assistant) => (
                      <Tr key={assistant.id}>
                        <Td>
                          <Link to={`/assistants/${assistant.id}`}>
                            {assistant.name}
                          </Link>
                        </Td>
                        <Td>{assistant.description}</Td>
                        <Td>
                          <Button
                            id={assistant.id}
                            onClick={() =>
                              navigate(`/assistants/${assistant.id}/chat`)
                            }
                            variant="warning"
                          >
                            Chat
                          </Button>
                        </Td>
                        <Td>
                          <Button
                            id={assistant.id}
                            onClick={() =>
                              navigate(`/assistants/${assistant.id}`)
                            }
                            variant="secondary"
                          >
                            Modify
                          </Button>
                        </Td>
                        <Td>
                          <Button
                            id={assistant.id}
                            onClick={deleteassistant}
                            variant="danger"
                          >
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
                title="Create a new assistant"
                description="Enter the information below to create a new assistant."
                isOpen={isModalOpen}
                onClose={handleModalToggle}
                footer={
                  defaultsLoading ? <p>Loading assistant defaults...</p> : null
                }
                actions={[
                  <Button
                    key="addassistant"
                    variant="primary"
                    form="add-assistant-button"
                    onClick={confirmHandler}
                    isDisabled={!isFormValid()}
                  >
                    Confirm
                  </Button>,
                  <Button
                    key="cancel"
                    variant="link"
                    onClick={handleModalToggle}
                  >
                    Cancel
                  </Button>,
                ]}
              >
                <Form>
                  <FormGroup>
                    <FormGroup label="Assistant Name" isRequired>
                      <TextInput
                        id="name"
                        isRequired
                        type="text"
                        name="name"
                        value={assistantData.name}
                        onChange={handleChange}
                      />
                    </FormGroup>

                    <FormGroup label="Assistant Description" isRequired>
                      <TextInput
                        id="description"
                        isRequired
                        type="text"
                        name="description"
                        value={assistantData.description}
                        onChange={handleChange}
                      />
                    </FormGroup>

                    <FormGroup label="Model (leave blank for default)">
                      <TextInput
                        id="model"
                        type="text"
                        name="model"
                        value={assistantData.model}
                        onChange={handleChange}
                      />
                    </FormGroup>

                    <FormGroup label="System Prompt" isRequired>
                      <TextArea
                        id="prompt"
                        isRequired
                        autoResize
                        resizeOrientation="vertical"
                        type="text"
                        name="system_prompt"
                        value={assistantData.system_prompt}
                        onChange={handleChange}
                        style={{ fontFamily: 'monospace' }}
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

export default Main;
