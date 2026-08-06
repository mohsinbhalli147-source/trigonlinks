import { User } from 'lucide-react';

interface CustomerProfileSummaryProps {
  customerData: any;
}

export default function CustomerProfileSummary({ customerData }: CustomerProfileSummaryProps) {
  return (
    <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <User className="text-[#4C8DFF] w-6 h-6" />
        <h3 className="text-lg font-semibold text-[#EAF0FB]">Profile Details</h3>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-[#8996AD]"><strong>Username:</strong> <span className="text-[#EAF0FB]">{customerData?.username}</span></p>
        <p className="text-sm text-[#8996AD]"><strong>CNIC:</strong> <span className="text-[#EAF0FB]">{customerData?.cnic}</span></p>
        <p className="text-sm text-[#8996AD]"><strong>Phone:</strong> <span className="text-[#EAF0FB]">{customerData?.mobile}</span></p>
        <p className="text-sm text-[#8996AD]"><strong>Email:</strong> <span className="text-[#EAF0FB]">{customerData?.email}</span></p>
      </div>
    </div>
  );
}
