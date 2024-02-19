import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Button,
  Form,
  FormGroup,
  FileUpload,
  TextInput,
  Panel,
  PanelMain,
  PanelMainBody,
  Title,
} from '@patternfly/react-core';
import { Table, Caption, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { Link } from 'react-router-dom';

const Main = () => {
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(true);
  const [agentData, setAgentData] = useState({
    name: '',
    description: '',
    file: null
  });

  useEffect(() => {
    getAgents();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setAgentData({
      ...agentData,
      [name]: files ? files[0] : value
    })
  }

  const getAgents = () => {
    axios.get('/agents')
      .then(response => {
        setData(response.data.data)
         setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching agents:', error);
      });
  };

  const addAgent = () => {
    const { name, description, system_prompt, file } = agentData;
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('system_prompt', system_prompt);
    formData.append('file', file);

    axios.post('/agents', formData)
      .then(() => {
        setAgentData({
          name: '',
          description: '',
          system_prompt: '',
          file: null
        });
        getAgents();
      })
      .catch(error => {
        console.error('Error adding agent:', error);
      })
  }

  const deleteAgent = (agent) => {
    axios.delete('/agents/' + agent.target.id)
      .then(() =>
        getAgents()
      )
      .catch(error => {
        console.error('Error deleting agent:', error);
      })
  }

  const uploadFile = (agent) => {
    const file = agent.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    axios.post('/agents/' + agent.target.id + '/document_upload', formData)
      .then(() =>
        getAgents()
      )
      .catch(error => {
        console.error('Error uploading file:', error);
      })
  }

  return (
    <Panel>
      <PanelMain>
        <PanelMainBody>
          <Title headingLevel="h1">Add Agent</Title>
          {loading ? (
              <p>Loading Agents...</p>
          ) : (
            <div>
              <Form>
                <FormGroup>
                  <FormGroup label="Agent Name" isRequired>
                    <TextInput id="name" isRequired type="text" name="name" value={agentData.name} onChange={handleChange} />
                  </FormGroup>

                  <FormGroup label="Agent Description" isRequired>
                    <TextInput id="description" isRequired type="text" name="description" value={agentData.description} onChange={handleChange} />
                  </FormGroup>

                  <FormGroup label="System Prompt" isRequired>
                    <TextInput id="prompt" isRequired type="text" name="system_prompt" value={agentData.system_prompt} onChange={handleChange} />
                  </FormGroup>

                  <FormGroup>
                    <Button onClick={addAgent}>Add Agent</Button>
                  </FormGroup>
                </FormGroup>
              </Form>

              <Title headingLevel="h1">Agents</Title>
              <Table aria-label="Simple table">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Name</Th>
                  <Th>Description</Th>
                  <Th>System Prompt</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.map(agent => (
                  <Tr key={agent.id}>
                    <Td>{agent.id}</Td>
                    <Link to={`/${agent.id}`}><Td>{agent.agent_name}</Td></Link>
                    <Td>{agent.description}</Td>
                    <Td>{agent.system_prompt}</Td>
                    <Td>
                      <input
                        id={agent.id}
                        type="file"
                        name="file"
                        onChange={uploadFile}
                      />
                      <Button id={agent.id} onClick={deleteAgent} variant="danger">Delete Agent</Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
              </Table>
            </div>
          )}
        </PanelMainBody>
      </PanelMain>
    </Panel>
  );
}

export default Main;
