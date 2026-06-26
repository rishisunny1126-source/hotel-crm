import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

export default function PublicFeedback() {
  const { bookingId } = useParams();
  const [info, setInfo] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comments, setComments] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get(`/public/booking/${bookingId}`).then(r => setInfo(r.data.data))
      .catch(() => setErr('We could not find this booking.'));
  }, [bookingId]);

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!rating) { setErr('Please select a star rating.'); return; }
    try {
      await api.post('/public/feedback', { booking_id: bookingId, rating, comments });
      setDone(true);
    } catch (e2) { setErr(e2.response?.data?.error?.message || 'Could not submit feedback.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-bold text-brand-700">Sri Nirvana Plaza</h1>
        <p className="text-sm text-slate-400 mb-4">We'd love your feedback</p>

        {done ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">🙏</div>
            <h2 className="font-semibold text-lg">Thank you!</h2>
            <p className="text-sm text-slate-500 mt-1">Your feedback has been recorded.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {info && <p className="text-sm">Hi <b>{info.guest_name?.split(' ')[0]}</b>, how was your stay in Room {info.room_number} ({info.room_type})?</p>}
            {err && <div className="text-sm text-red-600 bg-red-50 rounded p-2">{err}</div>}
            <div>
              <label className="label">Your rating</label>
              <div className="flex gap-1 text-3xl">
                {[1,2,3,4,5].map(n => (
                  <button type="button" key={n}
                    onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(n)}
                    className={(hover || rating) >= n ? 'text-amber-400' : 'text-slate-300'}>★</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Comments (optional)</label>
              <textarea className="input" rows="3" value={comments} onChange={e => setComments(e.target.value)}
                placeholder="Tell us what you loved or how we can improve…" />
            </div>
            <button className="btn-primary w-full">Submit Feedback</button>
          </form>
        )}
      </div>
    </div>
  );
}
