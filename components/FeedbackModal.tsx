
import React, { useState } from 'react';
import { SendIcon } from './icons';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setTimeout(() => {
        setSubmitted(true);
        setFeedback('');
        setTimeout(() => {
            setSubmitted(false);
            onClose();
        }, 2000);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-westmarc-light-gray relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-westmarc-light-gray bg-westmarc-midnight text-white flex justify-between items-center">
            <div>
                <h2 className="text-xl font-extrabold">Help Us Improve</h2>
                <p className="text-sm opacity-90">West Valley Data Initiative</p>
            </div>
            <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
        </div>

        {/* Content */}
        <div className="p-6">
            {!submitted ? (
                <>
                    <p className="text-sm text-westmarc-dark-gray mb-6">
                        We are actively collecting feedback to prioritize the next phase of development. 
                        Please let us know what data sets or features would be most valuable to you.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="feedback" className="block text-sm font-bold text-westmarc-midnight mb-2">
                                What data or features are missing?
                            </label>
                            <textarea
                                id="feedback"
                                rows={4}
                                className="w-full border border-westmarc-light-gray rounded-md p-3 text-sm focus:ring-2 focus:ring-westmarc-polaris focus:outline-none"
                                placeholder="e.g. 'I need traffic counts for Glendale' or 'Please add a map radius tool'..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-westmarc-cholla text-white font-bold py-2 px-4 rounded hover:bg-opacity-90 transition-colors flex items-center gap-2"
                            >
                                <SendIcon className="h-4 w-4" />
                                Submit Feedback
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-westmarc-light-gray">
                        <h3 className="text-sm font-bold uppercase text-westmarc-mid-gray tracking-wider mb-3">
                            Planned Enhancements (Phase 2)
                        </h3>
                        <ul className="space-y-2 text-sm text-westmarc-desert-night">
                            <li className="flex items-start gap-2">
                                <span className="text-westmarc-saguaro font-bold">•</span>
                                Workforce Gap Analysis (Labor Supply vs Demand)
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-westmarc-saguaro font-bold">•</span>
                                MAG Traffic Counts & Commute Shed Reports
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-westmarc-saguaro font-bold">•</span>
                                Radius Map View (1, 3, 5 mile)
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-westmarc-saguaro font-bold">•</span>
                                Detailed School Attainment Metrics
                            </li>
                        </ul>
                    </div>
                </>
            ) : (
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-westmarc-midnight">Thank You!</h3>
                    <p className="text-sm text-westmarc-dark-gray mt-2">Your feedback has been recorded and will help shape the future of this dashboard.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
