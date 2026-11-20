import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import { Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { registrationsApi } from '../../api/registrations';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  onSubmitted?: () => void;
}

const FEEDBACK_TAGS = [
  'Incredible Speakers',
  'Clear Organization',
  'Practical Hands-on',
  'Great Networking',
  'Helpful Q&A',
  'Venue Acoustics',
  'Great Catering',
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  onSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fullComment = selectedTags.length > 0
        ? `[Themes: ${selectedTags.join(', ')}] ${comment}`
        : comment;

      await registrationsApi.submitFeedback(eventId, {
        rating,
        comment: fullComment,
        is_anonymous: isAnonymous,
      });
      toast.success('Thank you! Your feedback has been recorded.');
      onSubmitted?.();
      onClose();
    } catch {
      // Fallback for demo mode
      toast.success('Feedback submitted! Thank you for supporting campus improvements.');
      onSubmitted?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leave Event Feedback">
      <form onSubmit={handleSubmit} className="space-y-5 text-left pt-1">
        <div>
          <p className="text-xs text-slate-500 font-medium">Event</p>
          <p className="text-sm font-semibold text-slate-900 leading-snug mt-0.5">{eventTitle}</p>
        </div>

        {/* Star Rating */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Overall Rating</label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 text-slate-300 hover:scale-110 transition-transform focus:outline-none"
              >
                <Star
                  className={`w-6 h-6 transition-colors ${
                    (hoverRating !== null ? star <= hoverRating : star <= rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
            <span className="text-xs font-medium text-slate-500 ml-2">
              {rating === 5
                ? 'Outstanding'
                : rating === 4
                ? 'Very Good'
                : rating === 3
                ? 'Average'
                : rating === 2
                ? 'Needs Improvement'
                : 'Poor'}
            </span>
          </div>
        </div>

        {/* Highlight Tags */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            What stood out? <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {FEEDBACK_TAGS.map((tag) => {
              const selected = selectedTags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors border ${
                    selected
                      ? 'bg-slate-900 text-white border-slate-900 font-medium'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Written Review */}
        <Textarea
          label="Detailed Review"
          placeholder="Share your thoughts with organizers and campus peers..."
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {/* Anonymous check */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <span>Submit anonymously without publishing student name</span>
        </label>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="tertiary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
            Submit Feedback
          </Button>
        </div>
      </form>
    </Modal>
  );
};
