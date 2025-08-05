import React from 'react';
import {
  ExpandableSection,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SearchInfo = ({ searchData }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const onToggle = (_event, isExpanded) => {
    setIsExpanded(isExpanded);
  };

  const snippetExpanded = searchData.map((data) => false);
  const [isSnippetExpanded, setIsSnippetExpanded] = React.useState([
    ...snippetExpanded,
  ]);
  const onSnippetToggle = (index) => {
    setIsSnippetExpanded((prevArray) => {
      const updatedArray = [...prevArray];
      updatedArray[index] = !isSnippetExpanded[index];
      return updatedArray;
    });
  };

  const markdownDivStyle = {
    padding: '1rem',
    '--pf-v5-c-content--h1--FontSize': '1rem',
    '--pf-v5-c-content--h2--FontSize': '0.95rem',
    '--pf-v5-c-content--h3--FontSize': '0.92rem',
    fontSize: '0.88rem',
    background: '#D2D2D2',
    borderRadius: '10px',
  };

  return (
    searchData.length > 0 &&
    searchData[0].metadata?.filename && (
      <ExpandableSection
        toggleText={isExpanded ? 'Hide search data' : 'Show search data'}
        onToggle={onToggle}
        isExpanded={isExpanded}
      >
        The following files were shown to the LLM.
        {searchData.map((content, index) => {
          const filename = content.metadata.filename;
          const pageContent = content.page_content;

          return (
            <div
              key={index}
              className="search-metadata"
              style={{ marginLeft: '0.5rem' }}
            >
              <TextContent>
                <Text
                  component={TextVariants.h5}
                  style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                >
                  Filename: {filename}
                </Text>
              </TextContent>
              <ExpandableSection
                toggleText={
                  isSnippetExpanded[index] ? 'Hide snippet' : 'Show snippet'
                }
                onToggle={() => onSnippetToggle(index)}
                isExpanded={isSnippetExpanded[index]}
              >
                <div style={markdownDivStyle}>
                  <Markdown remarkPlugins={[remarkGfm]}>{pageContent}</Markdown>
                </div>
              </ExpandableSection>
            </div>
          );
        })}
      </ExpandableSection>
    )
  );
};

export default SearchInfo;
