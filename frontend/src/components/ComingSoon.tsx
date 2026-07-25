import { Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export default function ComingSoon({ title = 'Coming Soon', description }: ComingSoonProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4C8DFF20] to-[#14E8B420] border border-[#232D45] flex items-center justify-center mb-6">
        <Clock className="w-10 h-10 text-[#4C8DFF]" />
      </div>
      <h2 className="text-2xl font-bold text-[#EAF0FB] mb-3">{title}</h2>
      <p className="text-sm text-[#5C6B85] max-w-sm leading-relaxed mb-8">
        {description || 'This feature is currently under development and will be available in an upcoming release.'}
      </p>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#232D45] hover:bg-[#2A3657] text-[#8996AD] hover:text-[#EAF0FB] rounded-lg text-sm font-medium transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Go Back
      </button>
    </div>
  );
}
