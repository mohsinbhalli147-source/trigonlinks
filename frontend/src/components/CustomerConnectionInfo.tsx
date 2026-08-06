import { Activity } from 'lucide-react';

interface CustomerConnectionInfoProps {
  customerData: any;
}

export default function CustomerConnectionInfo({ customerData }: CustomerConnectionInfoProps) {
  return (
    <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Activity className="text-[#14E8B4] w-6 h-6" />
        <h3 className="text-lg font-semibold text-[#EAF0FB]">Connection Info</h3>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-[#8996AD]"><strong>Package:</strong> <span className="text-[#EAF0FB]">{customerData?.package}</span></p>
        <p className="text-sm text-[#8996AD]"><strong>Area:</strong> <span className="text-[#EAF0FB]">{customerData?.area}</span></p>
        <p className="text-sm text-[#8996AD]">
          <strong>Status:</strong> 
          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
            customerData?.status === 'active' ? 'bg-[#14E8B4]/20 text-[#14E8B4]' : 'bg-[#F5514B]/20 text-[#F5514B]'
          }`}>
            {customerData?.status?.toUpperCase()}
          </span>
        </p>
        <p className="text-sm text-[#8996AD]"><strong>Installation Date:</strong> <span className="text-[#EAF0FB]">{customerData?.installDate}</span></p>
      </div>
    </div>
  );
}
