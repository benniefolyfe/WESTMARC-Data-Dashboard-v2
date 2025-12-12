
// src/components/AIInsights.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GoogleGenAI, Content } from "@google/genai";

import { SendIcon, LightbulbIcon, DownloadIcon, PrinterIcon, RefreshIcon, MapPinIcon, BriefcaseIcon } from './icons';
import { AI_SYSTEM_INSTRUCTION } from '../chatConstants';
import type { ZipCodeData } from '../types';
import { WEST_VALLEY_ZIP_CODES } from '../constants';
import { MetricConfig, MetricId } from '../metrics';
import { aggregateZipData } from '../utils/aggregateData';
import { formatZipSelection, formatMetricSelection } from '../utils/formatting';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface AIInsightsProps {
  selectedZips: string[];
  allWestValleyData: Record<string, ZipCodeData>;
  selectedMetricIds: MetricId[];
  metrics: Record<MetricId, MetricConfig>;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const formatZipsByCity = (zips: string[]): string => {
    return formatZipSelection(zips);
};

// Build a dynamic summary based on selected metrics
function buildContextSummary(
  contextData: ZipCodeData | null,
  selectedZips: string[],
  selectedMetricIds: MetricId[],
  metricsConfig: Record<MetricId, MetricConfig>
): string {
  const locationDesc = selectedZips.length > 0 ? formatZipsByCity(selectedZips) : "All West Valley";

  if (!contextData) {
    return `Context Location: ${locationDesc}\n\nNo aggregated numeric data was available for the selection.`;
  }

  // If no metrics selected, default to a standard overview set
  const metricIdsToShow = selectedMetricIds.length > 0 
    ? selectedMetricIds 
    : [
        'population', 
        'medianAge', 
        'populationGrowth', 
        'medianHouseholdIncome', 
        'povertyRate',
        'unemploymentRate', 
        'medianHomeValue', 
        'ownerOccupiedRate', 
        'hsGraduationRate', 
        'collegeGraduationRate'
      ];

  const dataLines: string[] = [];

  metricIdsToShow.forEach(id => {
      const config = metricsConfig[id];
      if (config) {
          const val = config.getValue(contextData);
          if (val !== null && val !== undefined && !isNaN(val)) {
              let displayVal = val.toString();
              if (config.format === 'currency') {
                  displayVal = `$${Math.round(val).toLocaleString()}`;
              } else if (config.format === 'percent') {
                  displayVal = `${val.toFixed(1)}%`;
              } else if (config.format === 'number') {
                  displayVal = val.toLocaleString(undefined, { maximumFractionDigits: 1 });
              }
              dataLines.push(`- ${config.label}: ${displayVal}`);
          }
      }
  });

  if (dataLines.length === 0) {
      return `Context Location: ${locationDesc}\n\nNo valid data points available for the selected metrics in this region.`;
  }

  return `Context Location: ${locationDesc}\n\n**Aggregated Data for Selection:**\n${dataLines.join('\n')}`;
}

const AIInsights: React.FC<AIInsightsProps> = ({
  selectedZips,
  allWestValleyData,
  selectedMetricIds,
  metrics,
  chatHistory,
  setChatHistory,
}) => {
  const zipsForContext = useMemo(
    () =>
      selectedZips.length > 0
        ? selectedZips
        : WEST_VALLEY_ZIP_CODES.map((z) => z.zip),
    [selectedZips]
  );
  
  const contextData = useMemo(() => {
    const dataToAggregate = zipsForContext
        .map(zip => allWestValleyData[zip])
        .filter((d): d is ZipCodeData => d !== undefined);
    return aggregateZipData(dataToAggregate);
  }, [zipsForContext, allWestValleyData]);


  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');

    const userMsg: ChatMessage = { role: 'user', content: userText };
    setChatHistory((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      // Build context string dynamically based on CURRENT selections
      const contextSummary = buildContextSummary(contextData, selectedZips, selectedMetricIds, metrics);

      const replyText = await getAIReply(userText, contextSummary, chatHistory);

      const assistantMsg: ChatMessage = {
        role: 'model',
        content: replyText,
      };

      setChatHistory((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        role: 'model',
        content:
          'There was an error generating insights. Please try again in a moment.',
      };
      setChatHistory((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to clear the conversation history?')) {
        setChatHistory([]); 
    }
  };

  const handleDownload = () => {
    const text = chatHistory.map(m => `${m.role.toUpperCase()}:\n${m.content}\n`).join('\n---\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'west-valley-ai-insights.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        const html = `
            <html>
                <head>
                    <title>AI Insights Conversation</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; line-height: 1.6; color: #122426; }
                        .message { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
                        .user { background-color: #f0fdf4; border: 1px solid #68D69C; }
                        .model { background-color: #f9fafb; border: 1px solid #D9D9D9; }
                        .role { font-weight: bold; margin-bottom: 5px; text-transform: uppercase; font-size: 0.8em; color: #4B4B4B; }
                        h1 { color: #1C4953; }
                        .context-box { background: #e0f2fe; padding: 10px; margin-bottom: 20px; border: 1px solid #7dd3fc; border-radius: 4px; font-size: 0.9em; }
                    </style>
                </head>
                <body>
                    <h1>West Valley Data Dashboard - AI Insights</h1>
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                    <div class="context-box">
                      <strong>Context at Print Time:</strong><br/>
                      Regions: ${selectedZips.length ? formatZipsByCity(selectedZips) : 'All West Valley'}<br/>
                      Metrics: ${selectedMetricIds.length ? selectedMetricIds.map(id => metrics[id]?.label).join(', ') : 'All Metrics'}
                    </div>
                    <hr/>
                    ${chatHistory.map(m => `
                        <div class="message ${m.role}">
                            <div class="role">${m.role}</div>
                            <div class="content">${m.content.replace(/\n/g, '<br/>')}</div>
                        </div>
                    `).join('')}
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }
    setShowExportMenu(false);
  };

  const disabled = isSending;

  // Context Descriptions for the Banner
  const locationDescription = selectedZips.length > 0 
    ? formatZipsByCity(selectedZips) 
    : "All West Valley";
  
  const metricDescription = formatMetricSelection(selectedMetricIds, metrics);

  return (
    <div className="bg-white rounded-lg shadow-md flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-westmarc-light-gray flex-shrink-0 flex justify-between items-start">
        <div>
            <h2 className="text-xl font-extrabold text-westmarc-midnight flex items-center gap-2">
            <LightbulbIcon className="h-6 w-6 text-westmarc-polaris" />
            AI Data Analyst
            </h2>
            <p className="text-sm text-westmarc-dark-gray">
            Ask questions about the selected data, or the entire West Valley region.
            </p>
        </div>
        {/* Reset Button */}
        <button 
            onClick={handleReset}
            className="text-xs text-westmarc-mid-gray hover:text-westmarc-cholla flex items-center gap-1 transition-colors"
            title="Start a new conversation"
        >
            <RefreshIcon className="h-4 w-4" />
            Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="h-[60vh] min-h-[400px] p-4 overflow-y-auto bg-gray-50/50"
      >
        {chatHistory.length === 0 ? (
           <div className="flex h-full items-center justify-center text-center p-8 text-westmarc-mid-gray">
             <div>
                <LightbulbIcon className="h-12 w-12 mx-auto mb-2 text-westmarc-light-gray" />
                <p className="font-semibold">Start your analysis</p>
                <p className="text-sm mt-1">Ask questions about trends, demographics, or economic data for the regions selected below.</p>
             </div>
           </div>
        ) : (
            <div className="space-y-4">
            {chatHistory.map((msg, index) => (
                <div
                key={index}
                className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
                >
                <div
                    className={`max-w-2xl rounded-lg px-4 py-2 shadow-sm text-sm ${
                    msg.role === 'user'
                        ? 'bg-westmarc-polaris text-white whitespace-pre-wrap'
                        : 'bg-white text-westmarc-desert-night border border-westmarc-light-gray prose prose-sm max-w-none'
                    }`}
                >
                    {msg.role === 'model' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    ) : (
                    msg.content
                    )}
                </div>
                </div>
            ))}

            {isSending && (
                <div className="flex justify-start">
                <div className="max-w-xs rounded-lg px-4 py-2 shadow-sm bg-white text-westmarc-dark-gray italic border border-westmarc-light-gray text-sm">
                    Thinking…
                </div>
                </div>
            )}
            </div>
        )}
      </div>

      {/* Context Banner - Responsive Vertical Expansion */}
      <div className="bg-blue-50 border-t border-b border-blue-100 p-2 px-4 flex flex-col sm:flex-row gap-2 text-xs text-westmarc-midnight shadow-inner h-auto min-h-[40px]">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
             <MapPinIcon className="h-3.5 w-3.5 text-westmarc-polaris flex-shrink-0 mt-0.5" />
             <span className="font-bold whitespace-nowrap">Focus:</span>
             <span className="whitespace-normal break-words" title={locationDescription}>{locationDescription}</span>
        </div>
        <div className="flex items-start gap-1.5 flex-1 min-w-0 border-l-0 sm:border-l sm:border-blue-200 sm:pl-4">
             <BriefcaseIcon className="h-3.5 w-3.5 text-westmarc-polaris flex-shrink-0 mt-0.5" />
             <span className="font-bold whitespace-nowrap">Metrics:</span>
             <span className="whitespace-normal break-words" title={metricDescription}>{metricDescription}</span>
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-westmarc-light-gray flex-shrink-0"
      >
        <div className="flex gap-2 items-center relative">
           {/* Export Menu */}
           <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 rounded-full text-westmarc-midnight hover:bg-westmarc-light-gray/50 transition-colors"
                title="Export Conversation"
              >
                  <DownloadIcon className="h-5 w-5" />
              </button>
              {showExportMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-md shadow-lg border border-westmarc-light-gray overflow-hidden z-10">
                      <button 
                        type="button"
                        onClick={handleDownload}
                        className="w-full text-left px-4 py-2 text-sm text-westmarc-desert-night hover:bg-westmarc-light-gray/30 flex items-center gap-2"
                      >
                          <DownloadIcon className="h-4 w-4" /> Download Text
                      </button>
                      <button 
                        type="button"
                        onClick={handlePrint}
                        className="w-full text-left px-4 py-2 text-sm text-westmarc-desert-night hover:bg-westmarc-light-gray/30 flex items-center gap-2"
                      >
                          <PrinterIcon className="h-4 w-4" /> Print
                      </button>
                  </div>
              )}
           </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            placeholder={
              isSending ? 'Waiting for response...' : 'Ask a question...'
            }
            className="flex-1 rounded-md border border-westmarc-light-gray px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-westmarc-polaris"
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="p-2 rounded-full bg-westmarc-midnight text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-westmarc-desert-night transition-colors"
            aria-label="Send message"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIInsights;

// Live Gemini integration with History
async function getAIReply(
  userText: string,
  contextSummary: string,
  history: ChatMessage[]
): Promise<string> {
  const apiKey = process.env.API_KEY as string | undefined;

  if (!apiKey) {
    console.warn('Gemini API key is not configured (API_KEY missing in environment).');
    return 'AI is not configured yet. Please add your Gemini API key and reload the page.';
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    
    // Construct System Instruction including data
    // WE ADD EXPLICIT INSTRUCTION TO IGNORE OLD CONTEXT
    const systemInstruction = [
        AI_SYSTEM_INSTRUCTION,
        "",
        "--- CURRENT DATA CONTEXT (HIGHEST PRIORITY) ---",
        "The following is the ONLY valid data context for the current user query. Ignore any previous data contexts found in the conversation history if they conflict with this one.",
        contextSummary,
        "--- END DATA CONTEXT ---"
    ].join('\n');

    // Build conversation contents from history
    const contents: Content[] = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));

    // Append the new user message
    contents.push({
        role: 'user',
        parts: [{ text: userText }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const text = response.text;

    if (!text || !text.trim()) {
      return 'I was not able to generate a meaningful answer from the available data.';
    }

    return text.trim();
  } catch (error) {
    console.error('Error calling Gemini for AIInsights:', error);
    if (
      error instanceof Error &&
      error.message.includes('API key not valid')
    ) {
      return 'There was an error generating AI insights: The provided API key is not valid. Please check your configuration.';
    }
    return 'There was an error generating AI insights. Please try again in a moment.';
  }
}
