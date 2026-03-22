import { useNavigate } from 'react-router';

export default function CreateRoomPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      <h1 className="text-on-surface font-display text-2xl font-bold mb-2">
        Create Room
      </h1>
      <p className="text-on-surface-variant font-body text-base text-center mb-8">
        Coming in Epic 2
      </p>
      <button
        type="button"
        onClick={handleGoBack}
        className="bg-surface-container-high rounded-md min-h-[48px] px-6 font-display text-sm font-bold text-on-surface cursor-pointer"
      >
        Go Back
      </button>
    </div>
  );
}
