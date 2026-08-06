import { CreditCard } from 'lucide-react';

interface CustomerBillingSummaryProps {
  customerData: any;
}

export default function CustomerBillingSummary({ customerData }: CustomerBillingSummaryProps) {
  return (
    <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <CreditCard className="text-[#F6B93B] w-6 h-6" />
        <h3 className="text-lg font-semibold text-[#EAF0FB]">Billing Summary</h3>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-[#8996AD]"><strong>Monthly Fee:</strong> <span className="text-[#EAF0FB]">Rs. {customerData?.fee}</span></p>
        <p className="text-sm text-[#8996AD]"><strong>Billing Date:</strong> <span className="text-[#EAF0FB]">{customerData?.billingDate} of every month</span></p>
      </div>
    </div>
  );
}
