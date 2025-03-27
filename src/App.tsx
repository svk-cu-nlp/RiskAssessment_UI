import React, { useState } from 'react';
import { Upload, X, XCircle, MessageSquare, Wand2 } from 'lucide-react';
import RiskAnalysis from './RiskAnalysis';

interface Comment {
  id: string;
  text: string;
  selectedText: string;
  startIndex: number;
  endIndex: number;
}

interface Rejection {
  id: string;
  selectedText: string;
  startIndex: number;
  endIndex: number;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState<string>('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [rejections, setRejections] = useState<Rejection[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectionIndices, setSelectionIndices] = useState<{ start: number; end: number } | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [featuresApproved, setFeaturesApproved] = useState(false);
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
    }
  };

  const handleExtractContent = () => {
    // Simulated content extraction
    const mockContent = `Security Requirements Specification

1. Authentication and Access Control
The system must implement strong authentication mechanisms using industry-standard protocols.
User sessions must timeout after 30 minutes of inactivity.
All access to sensitive data must be logged and monitored.

2. Data Protection
All sensitive data must be encrypted using AES-256 encryption at rest.
Data transmission must use TLS 1.3 or higher for encryption in transit.
Regular backup procedures must be implemented with encryption.

3. Audit and Compliance
The system shall maintain comprehensive audit logs for all security-related events.
Audit logs must be protected from unauthorized access and tampering.
Regular security assessments must be conducted every quarter.

4. System Security
The application must implement input validation for all user inputs.
Regular security patches must be applied within 48 hours of release.
A disaster recovery plan must be maintained and tested bi-annually.`;

    setContent(mockContent);
    setShowContent(true);
    setFeedbackSubmitted(false);
    setFeaturesApproved(false);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const text = selection.toString();
      
      const container = document.getElementById('content-container');
      if (container) {
        const containerContent = container.textContent || '';
        const startIndex = containerContent.indexOf(text);
        const endIndex = startIndex + text.length;

        setSelectedText(text);
        setSelectionIndices({ start: startIndex, end: endIndex });
      }
    }
  };

  const addComment = () => {
    if (selectedText && selectionIndices && commentInput.trim()) {
      const newComment: Comment = {
        id: Date.now().toString(),
        text: commentInput,
        selectedText,
        startIndex: selectionIndices.start,
        endIndex: selectionIndices.end
      };
      setComments([...comments, newComment]);
      setSelectedText('');
      setSelectionIndices(null);
      setShowCommentInput(false);
      setCommentInput('');
    }
  };

  const addRejection = () => {
    if (selectedText && selectionIndices) {
      const newRejection: Rejection = {
        id: Date.now().toString(),
        selectedText,
        startIndex: selectionIndices.start,
        endIndex: selectionIndices.end
      };
      setRejections([...rejections, newRejection]);
      setSelectedText('');
      setSelectionIndices(null);
      setShowCommentInput(false);
    }
  };

  const renderContentWithHighlights = () => {
    let result = content;
    const markers: { index: number; type: 'start' | 'end'; class: string; id: string }[] = [];

    rejections.forEach(rejection => {
      markers.push({ 
        index: rejection.startIndex, 
        type: 'start', 
        class: hoveredAnnotation === rejection.id ? 'bg-red-500/40' : 'bg-red-500/20',
        id: rejection.id
      });
      markers.push({ 
        index: rejection.endIndex, 
        type: 'end', 
        class: '',
        id: rejection.id
      });
    });

    comments.forEach(comment => {
      markers.push({ 
        index: comment.startIndex, 
        type: 'start', 
        class: hoveredAnnotation === comment.id ? 'bg-indigo-500/40' : 'bg-indigo-500/20',
        id: comment.id
      });
      markers.push({ 
        index: comment.endIndex, 
        type: 'end', 
        class: '',
        id: comment.id
      });
    });

    markers.sort((a, b) => {
      if (a.index === b.index) {
        return a.type === 'end' ? -1 : 1;
      }
      return b.index - a.index;
    });

    markers.forEach(marker => {
      const span = marker.type === 'start' 
        ? `<span class="${marker.class}" data-id="${marker.id}">`
        : '</span>';
      result = result.slice(0, marker.index) + span + result.slice(marker.index);
    });

    return result;
  };

  const removeAnnotation = (id: string) => {
    setComments(comments.filter(c => c.id !== id));
    setRejections(rejections.filter(r => r.id !== id));
  };

  const handleSubmitFeedback = () => {
    setFeedbackSubmitted(true);
    // Here you would typically send the feedback to a backend service
    console.log('Feedback submitted:', { comments, rejections });
  };

  const handleApproveFeatures = () => {
    setFeaturesApproved(true);
    // Here you would typically send the approval to a backend service
    console.log('Features approved');
  };

  const handleAnalyzeRisks = () => {
    setShowRiskAnalysis(true);
  };

  if (showRiskAnalysis) {
    return <RiskAnalysis onBack={() => setShowRiskAnalysis(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Security Requirements Analysis</h1>
        
        <p className="text-gray-300 mb-8">
          Upload your requirements specification document and analyze the content. Select text to reject specific portions or add comments.
        </p>

        {/* File Upload Section */}
        <div className="mb-8">
          <div className="border-2 border-dashed border-indigo-500 rounded-lg p-6 text-center">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.txt"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <Upload className="w-12 h-12 text-indigo-500 mb-4" />
              <span className="text-lg font-medium">Upload Requirements Document</span>
              <span className="text-sm text-gray-400 mt-2">PDF, DOC, DOCX, or TXT files</span>
            </label>
          </div>
          {file && (
            <div className="mt-4 bg-gray-800 rounded-lg p-4 flex items-center justify-between">
              <span className="text-gray-300">{file.name}</span>
              <span className="text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          )}
        </div>

        {/* Extract Content Button */}
        <button
          onClick={handleExtractContent}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg mb-8 flex items-center justify-center"
          disabled={!file}
        >
          <Wand2 className="w-5 h-5 mr-2" />
          Extract Content
        </button>

        {/* Content Analysis Section */}
        {showContent && (
          <>
            <div className="flex gap-6 mb-6">
              {/* Main Content Panel */}
              <div className="flex-1 bg-gray-800 rounded-lg p-6">
                <div
                  id="content-container"
                  className="text-gray-200 whitespace-pre-wrap"
                  onMouseUp={handleTextSelection}
                  dangerouslySetInnerHTML={{ __html: renderContentWithHighlights() }}
                />
              </div>

              {/* Annotations Panel */}
              <div className="w-96 space-y-4">
                {/* Selection Actions */}
                {selectedText && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">Selected Text:</h3>
                      <p className="text-gray-300 bg-gray-700 p-2 rounded">{selectedText}</p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={addRejection}
                        className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </button>
                      <button
                        onClick={() => setShowCommentInput(true)}
                        className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Comment
                      </button>
                    </div>
                  </div>
                )}

                {/* Comment Input */}
                {showCommentInput && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Add your comment..."
                        className="flex-1 bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addComment();
                          }
                        }}
                      />
                      <button
                        onClick={addComment}
                        className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Rejections List */}
                {rejections.length > 0 && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Rejections</h3>
                    <div className="space-y-3">
                      {rejections.map(rejection => (
                        <div 
                          key={rejection.id} 
                          className="bg-gray-700 rounded p-3 relative group"
                          onMouseEnter={() => setHoveredAnnotation(rejection.id)}
                          onMouseLeave={() => setHoveredAnnotation(null)}
                        >
                          <button
                            onClick={() => removeAnnotation(rejection.id)}
                            className="absolute -right-2 -top-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="text-red-400">
                            {rejection.selectedText}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments List */}
                {comments.length > 0 && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Comments</h3>
                    <div className="space-y-3">
                      {comments.map(comment => (
                        <div 
                          key={comment.id} 
                          className="bg-gray-700 rounded p-3 relative group"
                          onMouseEnter={() => setHoveredAnnotation(comment.id)}
                          onMouseLeave={() => setHoveredAnnotation(null)}
                        >
                          <button
                            onClick={() => removeAnnotation(comment.id)}
                            className="absolute -right-2 -top-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="text-gray-300 mb-2">
                            {comment.selectedText}
                          </div>
                          <div className="text-indigo-300 text-sm">
                            {comment.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Workflow Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={handleSubmitFeedback}
                className={`py-3 px-6 rounded-lg font-medium flex items-center justify-center ${
                  feedbackSubmitted
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                disabled={feedbackSubmitted}
              >
                Submit Feedback
              </button>
              <button
                onClick={handleApproveFeatures}
                className={`py-3 px-6 rounded-lg font-medium flex items-center justify-center ${
                  !feedbackSubmitted
                    ? 'bg-gray-600 cursor-not-allowed'
                    : featuresApproved
                    ? 'bg-green-600 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
                disabled={!feedbackSubmitted || featuresApproved}
              >
                Approve Features
              </button>
            </div>

            <button
              onClick={handleAnalyzeRisks}
              className={`w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center ${
                !featuresApproved
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
              disabled={!featuresApproved}
            >
              Analyze Risks
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
