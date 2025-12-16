
import React from 'react';

interface DataSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DataSourcesModal: React.FC<DataSourcesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-westmarc-light-gray">
        {/* Header */}
        <div className="px-6 py-4 border-b border-westmarc-light-gray flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-extrabold text-westmarc-midnight">Data Inventory & Sources</h2>
            <p className="text-sm text-westmarc-dark-gray mt-1">
              Transparency report for WESTMARC West Valley Data Dashboard
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="prose prose-sm max-w-none text-westmarc-desert-night">
            <p className="mb-4">
              This dashboard exclusively utilizes public data from the <strong>U.S. Census Bureau American Community Survey (ACS) 5-Year Estimates</strong>. 
              The current dataset loaded is the <strong>2018-2022</strong> release (published Dec 2023). Historical growth comparisons use the 2013-2017 dataset.
            </p>

            <h3 className="text-lg font-bold text-westmarc-midnight mb-3">Primary Data Sources</h3>
            <div className="overflow-x-auto border border-westmarc-light-gray rounded-lg">
              <table className="min-w-full divide-y divide-westmarc-light-gray">
                <thead className="bg-westmarc-off-white">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-westmarc-mid-gray uppercase tracking-wider">Metric Category</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-westmarc-mid-gray uppercase tracking-wider">Source</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-westmarc-mid-gray uppercase tracking-wider">Table ID / Variables</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-westmarc-mid-gray uppercase tracking-wider">Frequency</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-westmarc-light-gray">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-westmarc-midnight">Demographics</td>
                    <td className="px-4 py-3 text-sm text-gray-500">US Census ACS 5-Year</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">DP05 (Age, Race, Sex)</td>
                    <td className="px-4 py-3 text-sm text-gray-500">Annually</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-westmarc-midnight">Economics & Labor</td>
                    <td className="px-4 py-3 text-sm text-gray-500">US Census ACS 5-Year</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">DP03 (Employment, Income, Industry)</td>
                    <td className="px-4 py-3 text-sm text-gray-500">Annually</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-westmarc-midnight">Housing</td>
                    <td className="px-4 py-3 text-sm text-gray-500">US Census ACS 5-Year</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">DP04 (Value, Rent, Structure Age)</td>
                    <td className="px-4 py-3 text-sm text-gray-500">Annually</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-westmarc-midnight">Education</td>
                    <td className="px-4 py-3 text-sm text-gray-500">US Census ACS 5-Year</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">DP02 (Enrollment, Attainment)</td>
                    <td className="px-4 py-3 text-sm text-gray-500">Annually</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-westmarc-midnight">Historical Pop.</td>
                    <td className="px-4 py-3 text-sm text-gray-500">US Census ACS 5-Year (2017)</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">B01003 (Total Population)</td>
                    <td className="px-4 py-3 text-sm text-gray-500">Reference</td>
                  </tr>
                   <tr>
                    <td className="px-4 py-3 text-sm font-medium text-westmarc-midnight">Map Visualization</td>
                    <td className="px-4 py-3 text-sm text-gray-500">OpenStreetMap, CartoDB</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">Basemap Tiles</td>
                    <td className="px-4 py-3 text-sm text-gray-500">Continuous</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-bold text-westmarc-midnight mt-6 mb-2">Planned Data Integrations (Phase 2)</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li><strong>Workforce Data:</strong> Monthly reports on occupation/job availability (Internal/State sources).</li>
                <li><strong>Migration Data:</strong> Granular migration flows from IRS or MAG.</li>
                <li><strong>School Performance:</strong> Individual school attainment rates (State Dept of Education).</li>
            </ul>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <strong>Note on AI Analysis:</strong> The "AI Data Analyst" feature in this dashboard is strictly grounded in the datasets listed above. It does not search the open internet for answers, ensuring that all generated insights are based on the same verified WESTMARC data used in the charts.
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-westmarc-light-gray flex justify-end">
            <button 
                onClick={onClose}
                className="bg-westmarc-midnight text-white font-bold py-2 px-6 rounded hover:bg-westmarc-desert-night transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default DataSourcesModal;
