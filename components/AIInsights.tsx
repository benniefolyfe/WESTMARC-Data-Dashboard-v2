
// src/components/AIInsights.tsx
import React, { useEffect, useRef, useState, useMemo, useId } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GoogleGenAI, Content } from "@google/genai";
// @ts-ignore
import mermaid from 'mermaid';

import { SendIcon, LightbulbIcon, DownloadIcon, PrinterIcon, RefreshIcon, MapPinIcon, BriefcaseIcon } from './icons';
import { AI_SYSTEM_INSTRUCTION } from '../chatConstants';
import type { ZipCodeData } from '../types';
import { WEST_VALLEY_ZIP_CODES } from '../constants';
import { MetricConfig, MetricId } from '../metrics';
import { aggregateZipData } from '../utils/aggregateData';
import { formatZipSelection, formatMetricSelection } from '../utils/formatting';
import ClipboardButton from './ClipboardButton';

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

// New helper to build the full JSON context
function buildFullDataContext(
  individualData: ZipCodeData[],
  aggregatedData: ZipCodeData | null,
  selectedZips: string[]
): string {
  const locationDesc = selectedZips.length > 0 ? formatZipsByCity(selectedZips) : "All West Valley";
  
  if (!individualData || individualData.length === 0) {
      return `Context Location: ${locationDesc}\n\nNo data available.`;
  }

  // We provide the full dataset structure to the AI
  const payload = {
      description: `Data context for: ${locationDesc}`,
      summary: aggregatedData,
      // Pass detailed list for ranking/sorting questions
      // We map to ensure we send the full object structure defined in ZipCodeData
      detailed_breakdown: individualData 
  };

  return `Context Location: ${locationDesc}\n\n**Data Context (JSON):**\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
}

// Normalize chart syntax to fix common AI formatting issues
const normalizeMermaidChart = (chart: string): string => {
  let normalized = chart.trim();
  
  // Fix "pie title" on same line issue
  // Regex looks for "pie" followed by "title" on the same line (ignoring case)
  // Replaces it with "pie" newline + indentation + "title"
  // Example: "pie title My Chart" -> "pie\n    title My Chart"
  if (/^pie\s+title\s+/i.test(normalized)) {
      normalized = normalized.replace(/^pie\s+title\s+/i, 'pie\n    title ');
  }
  
  return normalized;
};

// -- Mermaid Component --
const MermaidChart = ({ chart }: { chart: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId().replace(/:/g, ''); // React 18+ unique ID, cleaned for CSS selectors
  
  useEffect(() => {
    // Initialize mermaid with custom WESTMARC theme
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      fontFamily: 'Figtree, sans-serif',
      pie: { 
        useMaxWidth: false,
        textPosition: 0.6 // Slightly outer placement for labels
      },
      // Override theme variables to match dashboard palette
      // Using 12 DISTINCT colors to avoid repetition in large datasets
      themeVariables: {
        darkMode: false,
        background: '#ffffff',
        fontFamily: 'Figtree, sans-serif',
        
        // General
        primaryColor: '#F2F2F2', 
        primaryTextColor: '#122426', // westmarc-desert-night
        primaryBorderColor: '#D9D9D9',
        lineColor: '#1C4953', // westmarc-midnight
        secondaryColor: '#68D69C', // westmarc-polaris
        tertiaryColor: '#F2F2F2',

        // Pie Chart Specific - 12 Distinct Colors from/derived from Palette
        pie1: '#1C4953', // Midnight (Dark Teal)
        pie2: '#92193B', // Amaranth (Dark Red)
        pie3: '#2A7C5E', // Saguaro (Dark Green)
        pie4: '#FF5C3E', // Cholla (Orange)
        pie5: '#4B4B4B', // Dark Gray
        pie6: '#68D69C', // Polaris (Medium Green)
        pie7: '#122426', // Desert Night (Blackish)
        pie8: '#C4B000', // Dark Gold (Contrast safe version of Brittlebrush)
        pie9: '#54808A', // Muted Midnight
        pie10: '#C06C84', // Muted Amaranth
        pie11: '#5E9982', // Muted Saguaro
        pie12: '#CC7A66', // Muted Cholla
        
        // Pie Chart Text & Borders
        pieTitleTextSize: '18px',
        pieTitleTextColor: '#1C4953', // Midnight for title
        pieSectionTextColor: '#ffffff', // White text on slices
        pieLegendTextColor: '#122426', // Darker text for legend
        pieStrokeColor: '#ffffff', // White borders between slices
        pieStrokeWidth: '2px',
        pieOuterStrokeWidth: '0px', // No outer border
        
        // Graph/Flowchart Specifics
        mainBkg: '#ffffff', // Clean background
        nodeBorder: '#1C4953',
        nodeTextColor: '#122426',
        edgeLabelBackground: '#ffffff',
      }
    });

    const renderChart = async () => {
        if (!containerRef.current) return;

        // Normalize syntax before rendering
        const normalizedChart = normalizeMermaidChart(chart);

        try {
            // Clear previous content
            containerRef.current.innerHTML = '';
            
            // Create a unique ID for this specific render cycle
            const id = `mermaid-${uniqueId}-${Date.now()}`;
            
            // Generate SVG
            const { svg } = await mermaid.render(id, normalizedChart);
            
            if (containerRef.current) {
                containerRef.current.innerHTML = svg;
                
                // Post-process SVG for cleaner scaling if needed
                const svgElement = containerRef.current.querySelector('svg');
                if (svgElement) {
                    svgElement.style.maxWidth = '100%';
                    svgElement.style.height = 'auto';
                    // Remove explicit width/height attributes to allow flexbox scaling
                    svgElement.removeAttribute('width');
                }
            }
        } catch (err) {
            console.error("Mermaid failed to render", err);
             // Fallback to text if render fails
             if (containerRef.current) {
                 containerRef.current.innerHTML = `<div class="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-mono whitespace-pre-wrap">Failed to render chart:\n${normalizedChart}</div>`;
             }
        }
    };

    renderChart();
  }, [chart, uniqueId]);

  return (
      <div className="relative group my-6 bg-white rounded-lg p-4 shadow-md overflow-hidden">
           <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 backdrop-blur rounded">
               <ClipboardButton targetRef={containerRef} ariaLabel="Copy Chart Image" />
           </div>
           <div 
             className="mermaid-container overflow-x-auto flex justify-center items-center min-h-[300px]" 
             ref={containerRef}
           />
      </div>
  );
}


// Custom Markdown Components
const MarkdownComponents: Components = {
    table: ({ node, ...props }) => {
        const tableRef = useRef<HTMLTableElement>(null);
        return (
            <div className="relative group my-4">
                <div className="absolute top-0 right-0 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ClipboardButton targetRef={tableRef} ariaLabel="Copy Table" />
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table ref={tableRef} {...props} className="min-w-full divide-y divide-gray-200" />
                </div>
            </div>
        );
    },
    code: ({ node, inline, className, children, ...props }: any) => {
        const content = String(children).replace(/\n$/, '');
        const match = /language-(\w+)/.exec(className || '');
        
        // Robust heuristic for Mermaid detection
        // Matches standard mermaid keywords at the start of the string (ignoring whitespace)
        const mermaidPattern = /^\s*(pie|graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|userJourney|journey|gitGraph|mindmap|timeline|quadrantChart|requirementDiagram|c4Context)/i;
        
        const isMermaid = (match && match[1] === 'mermaid') || (!inline && mermaidPattern.test(content));

        if (!inline && isMermaid) {
            return <MermaidChart chart={content} />;
        }
        
        return !inline ? (
            <div className="relative group my-4 rounded-md bg-gray-100 overflow-hidden border border-gray-200">
                 {match && (
                     <div className="absolute top-2 right-2 select-none">
                         <span className="text-[10px] text-gray-500 font-mono uppercase bg-gray-200 px-2 py-1 rounded">{match[1]}</span>
                     </div>
                 )}
                <pre className="p-4 overflow-x-auto">
                    <code className={`${className || ''} text-sm text-gray-800 font-mono`} {...props}>
                        {children}
                    </code>
                </pre>
            </div>
        ) : (
            <code className={`${className || ''} bg-gray-100 text-westmarc-midnight font-bold rounded px-1.5 py-0.5 text-xs border border-gray-200`} {...props}>
                {children}
            </code>
        );
    },
    thead: ({node, ...props}) => <thead {...props} className="bg-gray-50" />,
    th: ({node, ...props}) => <th {...props} className="px-3 py-2 text-left text-xs font-bold text-westmarc-midnight uppercase tracking-wider border-b border-gray-200" />,
    td: ({node, ...props}) => <td {...props} className="px-3 py-2 whitespace-nowrap text-sm text-gray-600 border-b border-gray-100" />,
    ul: ({node, ...props}) => <ul {...props} className="list-disc pl-5 my-2 space-y-1" />,
    ol: ({node, ...props}) => <ol {...props} className="list-decimal pl-5 my-2 space-y-1" />,
    p: ({node, ...props}) => <p {...props} className="my-2 leading-relaxed" />,
    h3: ({node, ...props}) => <h3 {...props} className="text-lg font-bold text-westmarc-midnight mt-6 mb-2 border-b border-westmarc-light-gray pb-1" />,
    strong: ({node, ...props}) => <strong {...props} className="font-extrabold text-westmarc-midnight" />,
};


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
  
  const individualData = useMemo(() => {
    return zipsForContext
        .map(zip => allWestValleyData[zip])
        .filter((d): d is ZipCodeData => d !== undefined);
  }, [zipsForContext, allWestValleyData]);

  const contextData = useMemo(() => {
    return aggregateZipData(individualData);
  }, [individualData]);


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
      // Build context string dynamically based on CURRENT selections.
      // We now pass the FULL individual data array, allowing the AI to answer ranking/granular questions.
      const contextSummary = buildFullDataContext(individualData, contextData, selectedZips);

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
    if (!scrollRef.current) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        // Capture the rendered HTML from the chat container
        // We need to strip out the 'Copy' buttons for print
        const clonedNode = scrollRef.current.cloneNode(true) as HTMLElement;
        const buttons = clonedNode.querySelectorAll('button');
        buttons.forEach(btn => btn.remove());
        
        const content = clonedNode.innerHTML;
        const timestamp = new Date().toLocaleString();

        const html = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>AI Insights Report - West Valley Data Dashboard</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
                    <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;600;800&display=swap" rel="stylesheet">
                    <style>
                        body { 
                            font-family: 'Figtree', sans-serif; 
                            padding: 40px; 
                            color: #122426; 
                            -webkit-print-color-adjust: exact; 
                            print-color-adjust: exact; 
                        }
                        
                        /* Table Styling - Dashboard Style */
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-top: 1rem; 
                            margin-bottom: 1.5rem; 
                            font-size: 0.9em;
                            border: 1px solid #D9D9D9;
                        }
                        th { 
                            background-color: #F2F2F2; 
                            color: #1C4953; 
                            font-weight: 800; 
                            text-align: left; 
                            padding: 0.75rem; 
                            border-bottom: 2px solid #D9D9D9;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            font-size: 0.8em;
                        }
                        td { 
                            padding: 0.75rem; 
                            border-bottom: 1px solid #e5e7eb; 
                        }
                        tr:nth-child(even) { background-color: #f9fafb; }
                        
                        /* Hide UI elements */
                        #ai-thinking-bubble { display: none !important; }
                        
                        /* Message Bubbles for Print */
                        .flex { display: flex; margin-bottom: 1.5rem; }
                        .justify-end { justify-content: flex-end; }
                        .justify-start { justify-content: flex-start; }
                        
                        /* User Message Style Override for Print */
                        .bg-westmarc-polaris { 
                            background-color: #f0fdf4 !important; /* Very light green for print legibility */
                            color: #064e3b !important; 
                            border: 1px solid #68D69C;
                        }
                        .text-white {
                            color: #122426 !important;
                        }

                        /* AI Message Style */
                        .prose { max-width: none; }
                        
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="mb-8 border-b-2 border-[#1C4953] pb-4">
                        <div class="flex justify-between items-end mb-2">
                             <h1 class="text-3xl font-extrabold text-[#1C4953]">AI Data Analysis Report</h1>
                             <span class="text-sm text-gray-500">${timestamp}</span>
                        </div>
                        <p class="text-sm text-[#4B4B4B]">WESTMARC West Valley Data Dashboard</p>
                        
                        <div class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <span class="font-bold text-[#1C4953] uppercase text-xs tracking-wider">Region Context</span><br/>
                                    ${selectedZips.length ? formatZipsByCity(selectedZips) : 'All West Valley'}
                                </div>
                                <div>
                                    <span class="font-bold text-[#1C4953] uppercase text-xs tracking-wider">Data Source</span><br/>
                                    U.S. Census Bureau ACS 5-Year Estimates
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-6">
                        ${content}
                    </div>

                    <div class="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                        Generated by WESTMARC Data Dashboard AI Analyst
                    </div>

                    <script>
                        // Slight delay to ensure styles and fonts load
                        setTimeout(() => {
                            window.print();
                        }, 800);
                    </script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    }
    setShowExportMenu(false);
  };

  const disabled = isSending;

  // Context Descriptions for the Banner
  const locationDescription = selectedZips.length > 0 
    ? formatZipsByCity(selectedZips) 
    : "All West Valley";
  
  // Update banner to reflect that AI has full access
  const contextDescription = selectedMetricIds.length > 0
    ? "Full dataset access (Prioritizing selection)"
    : "Full dataset access";

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
                <p className="text-sm mt-1">Ask questions like "Which city has the highest population?" or "Compare income levels in Glendale and Peoria".</p>
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
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                    >
                        {msg.content}
                    </ReactMarkdown>
                    ) : (
                    msg.content
                    )}
                </div>
                </div>
            ))}

            {isSending && (
                <div id="ai-thinking-bubble" className="flex justify-start">
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
             <span className="font-bold whitespace-nowrap">Data Access:</span>
             <span className="whitespace-normal break-words" title={contextDescription}>{contextDescription}</span>
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
        "The following JSON contains both a 'summary' of the selected region and a 'detailed_breakdown' array containing data for each individual zip code/city in the selection.",
        "Use the 'summary' object for general questions about the selected area as a whole.",
        "USE THE 'detailed_breakdown' ARRAY TO ANSWER QUESTIONS ABOUT SPECIFIC CITIES, RANKINGS, OR COMPARISONS.",
        "Ignore any previous data contexts found in the conversation history if they conflict with this one.",
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
