import React from 'react';
import {
  ExpandableSection,
  Text,
  TextContent,
  TextVariants,
  Button,
} from '@patternfly/react-core';
import ExternalLinkSquareAltIcon from '@patternfly/react-icons/dist/esm/icons/external-link-square-alt-icon';

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
    searchData[0].metadata?.full_path && (
      <ExpandableSection
        toggleText={isExpanded ? 'Hide sources' : 'Show sources'}
        onToggle={onToggle}
        isExpanded={isExpanded}
      >
        {searchData.map((content, index) => {
          const title = content.metadata.title;
          const citation_url = content.metadata.citation_url;
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
                  {title}
                  {citation_url && citation_url !== 'None' && (
                    <Button
                      variant="link"
                      size="sm"
                      icon={<ExternalLinkSquareAltIcon />}
                      component="a"
                      href={citation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open citation for ${title}`}
                    />
                  )}
                </Text>
              </TextContent>
              <ExpandableSection
                toggleText={
                  isSnippetExpanded[index] ? 'Hide content' : 'Show content'
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
