import React from 'react';
import {
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  Button,
  TextContent,
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
          <TextContent style={{ color: 'black' }}>
            <Text component={TextVariants.h3}>Tangerine</Text>
          </TextContent>
        </Button>
        <Button
          variant="plain"
          onClick={() => navigate('/')}
          style={{ marginRight: '1rem' }}
        >
          <TextContent style={{ color: 'black' }}>
            <Text component={TextVariants.h4}>Assistants</Text>
          </TextContent>
        </Button>
        <Button variant="plain" onClick={() => navigate('/knowledgebases')}>
          <TextContent style={{ color: 'black' }}>
            <Text component={TextVariants.h4}>Knowledge Bases</Text>
          </TextContent>
        </Button>
      </MastheadContent>
    </Masthead>
  );
};

export default Header;
