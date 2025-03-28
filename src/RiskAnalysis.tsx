import React, { useState, useEffect } from 'react';
import { X, XCircle, MessageSquare } from 'lucide-react';
import { analyzeRisks, submitRiskFeedback } from './services/api';

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

interface RiskAnalysisProps {
  onBack: () => void;
  features: string;
  srsContent: string;
  projectSummary: string;
}

function RiskAnalysis({ onBack, features, srsContent, projectSummary }: RiskAnalysisProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [rejections, setRejections] = useState<Rejection[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectionIndices, setSelectionIndices] = useState<{ start: number; end: number } | null>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [reportApproved, setReportApproved] = useState(false);
  const [riskReport, setRiskReport] = useState<string>('Loading risk analysis...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRiskAnalysis();
  }, []);

  const fetchRiskAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analyzeRisks(features, srsContent, projectSummary);
      setRiskReport(response.risk_analysis);
    } catch (err) {
      setError('Failed to fetch risk analysis. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      setIsLoading(true);
      const feedback = {
        comments: comments.map(comment => ({
          text: comment.text,
          selected_text: comment.selectedText,
          start_index: comment.startIndex,
          end_index: comment.endIndex
        })),
        rejections: rejections.map(rejection => ({
          selected_text: rejection.selectedText,
          start_index: rejection.startIndex,
          end_index: rejection.endIndex
        }))
      };

      await submitRiskFeedback(riskReport, feedback);
      setFeedbackSubmitted(true);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const text = selection.toString();
      
      const container = document.getElementById('risk-report-container');
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

  const removeAnnotation = (id: string) => {
    setComments(comments.filter(c => c.id !== id));
    setRejections(rejections.filter(r => r.id !== id));
  };

  const renderReportWithHighlights = () => {
    let result = riskReport;
    const markers: { index: number; type: 'start' | 'end'; class: string; id: string }[] = [];

    // Add markers for rejections and comments
    [...rejections, ...comments].forEach(item => {
      const isComment = 'text' in item;
      markers.push({
        index: item.startIndex,
        type: 'start',
        class: hoveredAnnotation === item.id 
          ? (isComment ? 'bg-indigo-500/40' : 'bg-red-500/40')
          : (isComment ? 'bg-indigo-500/20' : 'bg-red-500/20'),
        id: item.id
      });
      markers.push({
        index: item.endIndex,
        type: 'end',
        class: '',
        id: item.id
      });
    });

    // Sort markers and apply highlighting
    markers.sort((a, b) => b.index - a.index);
    markers.forEach(marker => {
      const span = marker.type === 'start'
        ? `<span class="${marker.class}" data-id="${marker.id}">`
        : '</span>';
      result = result.slice(0, marker.index) + span + result.slice(marker.index);
    });

    return result;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Risk Analysis Report</h1>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            Back to Requirements
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        <div className="flex gap-6">
          {/* Main Report Panel */}
          <div className="flex-1 bg-gray-800 rounded-lg p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div
                id="risk-report-container"
                className="text-gray-200 whitespace-pre-wrap"
                onMouseUp={handleTextSelection}
                dangerouslySetInnerHTML={{ __html: renderReportWithHighlights() }}
              />
            )}
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

            {/* Annotations Lists */}
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
                      <div className="text-red-400">{rejection.selectedText}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                      <div className="text-gray-300 mb-2">{comment.selectedText}</div>
                      <div className="text-indigo-300 text-sm">{comment.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <button
            onClick={handleSubmitFeedback}
            className={`py-3 px-6 rounded-lg font-medium flex items-center justify-center ${
              isLoading || feedbackSubmitted
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            disabled={isLoading || feedbackSubmitted}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Submit Feedback'
            )}
          </button>
          <button
            onClick={() => setReportApproved(true)}
            className={`py-3 px-6 rounded-lg font-medium flex items-center justify-center ${
              !feedbackSubmitted
                ? 'bg-gray-600 cursor-not-allowed'
                : reportApproved
                ? 'bg-green-600 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            disabled={!feedbackSubmitted || reportApproved}
          >
            Approve Risk Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default RiskAnalysis;
