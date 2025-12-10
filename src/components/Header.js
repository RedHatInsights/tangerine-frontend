import React from 'react';
import {
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  Button,
  Content,
} from '@patternfly/react-core';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  return (
    <Masthead id="light200-masthead" backgroundColor="light200">
      <MastheadMain>
        <MastheadBrand>
          <Button variant="plain" onClick={() => navigate('/')}>
            🍊
          </Button>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Button
          variant="plain"
          onClick={() => navigate('/')}
          style={{ marginRight: '1rem' }}
        >
          <Content style={{ color: 'black' }}>
            <h3>Tangerine</h3>
          </Content>
        </Button>
        <Button
          variant="plain"
          onClick={() => navigate('/')}
          style={{ marginRight: '1rem' }}
        >
          <Content style={{ color: 'black' }}>
            <h4>Assistants</h4>
          </Content>
        </Button>
        <Button variant="plain" onClick={() => navigate('/knowledgebases')}>
          <Content style={{ color: 'black' }}>
            <h4>Knowledge Bases</h4>
          </Content>
        </Button>
      </MastheadContent>
    </Masthead>
  );
};

export default Header;
