import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
  SimpleList,
  SimpleListItem,
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
} from '@patternfly/react-core';
import AngleLeftIcon from '@patternfly/react-icons/dist/esm/icons/angle-left-icon';
import TrashIcon from '@patternfly/react-icons/dist/esm/icons/trash-icon';
import UploadIcon from '@patternfly/react-icons/dist/esm/icons/upload-icon';
import ExternalLinkSquareAltIcon from '@patternfly/react-icons/dist/esm/icons/external-link-square-alt-icon';

function KnowledgeBase() {
  const { knowledgeBaseId } = useParams();

  const [kbInfo, setKbInfo] = useState({
    id: '',
    name: '',
    description: '',
    filenames: [],
  });
  const [modalKbInfo, setModalKbInfo] = useState({
    id: '',
    name: '',
    description: '',
  });
  const [currentFiles, setCurrentFiles] = useState([]);
  const [readFileData, setReadFileData] = useState([]);
  const [pendingUploads, setPendingUploads] = useState(new Set());

  const navigate = useNavigate();

  const [isModalOpen, setModalOpen] = React.useState(false);
  const handleModalToggle = (_event) => {
    if (!isModalOpen) {
      setModalKbInfo({ ...kbInfo });
    }
    setModalOpen(!isModalOpen);
  };

  useEffect(() => {
    getKbInfo();
  }, []);

  const getKbInfo = () => {
    axios
      .get(`/api/knowledgebases/${knowledgeBaseId}`)
      .then((response) => {
        const kbData = response.data.data || response.data;
        setKbInfo(kbData);
        setModalKbInfo(kbData);
      })
      .catch((error) => {
        console.error('Error fetching knowledge base:', error);
      });
  };

  const updateKb = () => {
    const { name, description } = modalKbInfo;
    axios
      .put(`/api/knowledgebases/${knowledgeBaseId}`, {
        name: name,
        description: description,
      })
      .then(() => {
        getKbInfo();
      })
      .catch((error) => {
        console.error('Error updating knowledge base:', error);
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setModalKbInfo({
      ...modalKbInfo,
      [name]: value,
    });
  };

  const confirmHandler = () => {
    updateKb();
    handleModalToggle();
  };

  const handleFileDrop = (event, droppedFiles) => {
    const validFiles = droppedFiles.filter((file) => {
      const extension = file.name.split('.').pop().toLowerCase();
      return ['md', 'txt', 'pdf'].includes(extension);
    });

    setCurrentFiles((prevFiles) => [...prevFiles, ...validFiles]);
  };

  const handleReadSuccess = (data, file) => {
    setReadFileData((prevData) => [
      ...prevData,
      { data, file, loadResult: 'in-progress', progressValue: 25 },
    ]);

    // Add file to pending uploads
    setPendingUploads((prev) => new Set([...prev, file.name]));

    // Upload the file using fetch for streaming
    const formData = new FormData();
    formData.append('file', file);

    fetch(`/api/knowledgebases/${knowledgeBaseId}/documents`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        const processStream = () => {
          return reader.read().then(({ done, value }) => {
            if (done) {
              return;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter((line) => line.trim());

            lines.forEach((line) => {
              try {
                const event = JSON.parse(line);

                // Match by filename - the backend sends file.display_name with "default:" prefix
                const backendFilename = event.file.replace(/^default:/, '');
                if (backendFilename === file.name) {
                  if (event.step === 'start') {
                    setReadFileData((prevData) =>
                      prevData.map((item) =>
                        item.file === file
                          ? {
                              ...item,
                              loadResult: 'in-progress',
                              progressValue: 50,
                            }
                          : item
                      )
                    );
                  } else if (event.step === 'end') {
                    setReadFileData((prevData) =>
                      prevData.map((item) =>
                        item.file === file
                          ? {
                              ...item,
                              loadResult: 'success',
                              progressValue: 100,
                            }
                          : item
                      )
                    );

                    // Remove from pending uploads
                    setPendingUploads((prev) => {
                      const newSet = new Set(prev);
                      newSet.delete(file.name);

                      // If no more pending uploads, refresh KB info
                      if (newSet.size === 0) {
                        getKbInfo();
                      }

                      return newSet;
                    });
                  }
                }
              } catch (e) {
                console.error('Error parsing streaming response:', e);
              }
            });

            return processStream();
          });
        };

        return processStream();
      })
      .catch((error) => {
        console.error('Error uploading file:', error);
        setReadFileData((prevData) =>
          prevData.map((item) =>
            item.file === file
              ? { ...item, loadResult: 'danger', progressValue: 0 }
              : item
          )
        );

        // Remove from pending uploads even on error
        setPendingUploads((prev) => {
          const newSet = new Set(prev);
          newSet.delete(file.name);

          // If no more pending uploads, refresh KB info
          if (newSet.size === 0) {
            getKbInfo();
          }

          return newSet;
        });
      });
  };

  const handleReadFail = (error, file) => {
    setReadFileData((prevData) => [
      ...prevData,
      { file, loadResult: 'danger' },
    ]);

    // Remove from pending uploads on read fail
    setPendingUploads((prev) => {
      const newSet = new Set(prev);
      newSet.delete(file.name);

      // If no more pending uploads, refresh KB info
      if (newSet.size === 0) {
        getKbInfo();
      }

      return newSet;
    });
  };

  const removeFile = (file) => {
    setCurrentFiles((prevFiles) => prevFiles.filter((f) => f !== file));
    setReadFileData((prevData) =>
      prevData.filter((item) => item.file !== file)
    );

    // Remove from pending uploads if manually removed
    setPendingUploads((prev) => {
      const newSet = new Set(prev);
      newSet.delete(file.name);
      return newSet;
    });
  };

  const deleteDocument = (filename) => {
    axios
      .delete(`/api/knowledgebases/${knowledgeBaseId}/documents`, {
        data: { filename: filename },
      })
      .then(() => getKbInfo())
      .catch((error) => {
        console.error('Error deleting document:', error);
      });
  };

  return (
    <div style={{ marginLeft: '2.5rem' }}>
      <div style={{ paddingTop: '1rem', paddingBottom: '2rem' }}>
        <Button
          variant="secondary"
          icon={<AngleLeftIcon />}
          onClick={() => navigate('/knowledgebases')}
        >
          Back to Knowledge Bases
        </Button>
      </div>
      <div style={{ marginBottom: '2rem' }}>
        <DescriptionList
          isHorizontal
          isCompact
          isAutoColumnWidths
          aria-label="Knowledge Base Details"
        >
          <DescriptionListGroup>
            <DescriptionListTerm>Knowledge Base Name</DescriptionListTerm>
            <DescriptionListDescription>
              {kbInfo.name}
              <Button
                variant="link"
                size="sm"
                icon={<ExternalLinkSquareAltIcon />}
                iconPosition="end"
                onClick={handleModalToggle}
                style={{ marginLeft: '8px' }}
              >
                Edit
              </Button>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Description</DescriptionListTerm>
            <DescriptionListDescription>
              {kbInfo.description}
              <Button
                variant="link"
                size="sm"
                icon={<ExternalLinkSquareAltIcon />}
                iconPosition="end"
                onClick={handleModalToggle}
                style={{ marginLeft: '8px' }}
              >
                Edit
              </Button>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Uploaded Documents</DescriptionListTerm>
            <DescriptionListDescription>
              {kbInfo.filenames && kbInfo.filenames.length === 0 ? (
                <Text component={TextVariants.p}>No documents uploaded.</Text>
              ) : (
                <SimpleList>
                  {kbInfo.filenames &&
                    kbInfo.filenames.map((filename) => (
                      <SimpleListItem key={filename}>
                        <span>{filename}</span>
                        <Button
                          variant="plain"
                          aria-label={`Delete ${filename}`}
                          onClick={() => deleteDocument(filename)}
                        >
                          <TrashIcon />
                        </Button>
                      </SimpleListItem>
                    ))}
                </SimpleList>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </div>
      <div style={{ marginBottom: '2rem' }}>
        <MultipleFileUpload
          onFileDrop={handleFileDrop}
          dropzoneProps={{
            accept: {
              'text/markdown': ['.md'],
              'text/plain': ['.txt'],
              'application/pdf': ['.pdf'],
            },
          }}
        >
          <MultipleFileUploadMain
            titleIcon={<UploadIcon />}
            titleText="Drag and drop files here"
            titleTextSeparator="or"
            infoText="Accepted file types: .md, .txt, .pdf"
          />
          <MultipleFileUploadStatus statusToggleText={`Upload status`}>
            {currentFiles.map((file, index) => {
              const fileData = readFileData.find((item) => item.file === file);
              return (
                <MultipleFileUploadStatusItem
                  key={index}
                  file={file}
                  onClearClick={() => removeFile(file)}
                  onReadSuccess={handleReadSuccess}
                  onReadFail={handleReadFail}
                  progressValue={fileData?.progressValue}
                  progressVariant={
                    fileData?.loadResult === 'danger'
                      ? 'danger'
                      : fileData?.loadResult === 'success'
                        ? 'success'
                        : 'info'
                  }
                />
              );
            })}
          </MultipleFileUploadStatus>
        </MultipleFileUpload>
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
          </Button>,
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
                value={modalKbInfo.name}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup label="Description" isRequired>
              <TextArea
                id="description"
                isRequired
                name="description"
                value={modalKbInfo.description}
                onChange={handleChange}
                autoResize
                resizeOrientation="vertical"
              />
            </FormGroup>
          </FormGroup>
        </Form>
      </Modal>
    </div>
  );
}

export default KnowledgeBase;
