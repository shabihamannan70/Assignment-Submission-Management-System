import React from 'react';

interface AssignmentDescriptionProps {
  content: string;
}

export function AssignmentDescription({ content }: AssignmentDescriptionProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  let currentList: React.ReactNode[] | null = null;
  
  const headingRegex = /^(Assignment Overview|Overview|Task Details|Section\s+[A-Z0-9]+|Instructions|Submission Requirement[s]?):?\s*$/i;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Empty line
    if (!trimmed) {
      if (currentList) {
        elements.push(<ul key={`ul-${index}`} className="list-disc pl-6 mb-4 space-y-2">{currentList}</ul>);
        currentList = null;
      }
      return;
    }
    
    // Heading
    if (headingRegex.test(trimmed)) {
      if (currentList) {
        elements.push(<ul key={`ul-${index}`} className="list-disc pl-6 mb-4 space-y-2">{currentList}</ul>);
        currentList = null;
      }
      
      const cleanHeading = trimmed.replace(/:$/, '');
      elements.push(
        <h3 key={`h-${index}`} className="text-lg font-semibold text-gray-900 mt-6 mb-3 border-b pb-1">
          {cleanHeading}
        </h3>
      );
      return;
    }
    
    // Bullet point
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      if (!currentList) currentList = [];
      const listItemContent = trimmed.substring(1).trim();
      currentList.push(<li key={`li-${index}`} className="text-gray-700">{listItemContent}</li>);
      return;
    }
    
    // Normal text
    if (currentList) {
      elements.push(<ul key={`ul-${index}`} className="list-disc pl-6 mb-4 space-y-2">{currentList}</ul>);
      currentList = null;
    }
    
    elements.push(
      <p key={`p-${index}`} className="text-gray-700 mb-2 leading-relaxed">
        {line}
      </p>
    );
  });
  
  if (currentList) {
    elements.push(<ul key={`ul-last`} className="list-disc pl-6 mb-4 space-y-2">{currentList}</ul>);
  }

  return (
    <div className="assignment-content">
      {elements}
    </div>
  );
}
