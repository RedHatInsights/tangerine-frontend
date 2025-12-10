import React from 'react';
import {
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  Button,
  Content,
  Text,
  TextVariants,
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
            <Text component={TextVariants.h3}>Tangerine</Text>
          </Content>
        </Button>
        <Button
          variant="plain"
          onClick={() => navigate('/')}
          style={{ marginRight: '1rem' }}
        >
          <Content style={{ color: 'black' }}>
            <Text component={TextVariants.h4}>Assistants</Text>
          </Content>
        </Button>
        <Button variant="plain" onClick={() => navigate('/knowledgebases')}>
          <Content style={{ color: 'black' }}>
            <Text component={TextVariants.h4}>Knowledge Bases</Text>
          </Content>
        </Button>
      </MastheadContent>
    </Masthead>
  );
};

export default Header;
