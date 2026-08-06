import { FileText } from 'lucide-react';

interface CustomerRecentInvoicesProps {
  invoices: any[];
}

export default function CustomerRecentInvoices({ invoices }: CustomerRecentInvoicesProps) {
  return (
    <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="text-[#4C8DFF] w-6 h-6" />
        <h3 className="text-lg font-semibold text-[#EAF0FB]">Recent Invoices</h3>
      </div>
      
      {invoices.length === 0 ? (
        <p className="text-[#8996AD] text-sm">No recent invoices found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="py-3 px-4 text-sm font-medium text-[#8996AD]">Invoice No.</th>
                <th className="py-3 px-4 text-sm font-medium text-[#8996AD]">Date</th>
                <th className="py-3 px-4 text-sm font-medium text-[#8996AD]">Amount</th>
                <th className="py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-[#232D45] hover:bg-[#1B2540]">
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{inv.id.slice(0, 8).toUpperCase()}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">Rs. {inv.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      inv.status === 'paid' ? 'bg-[#14E8B4]/20 text-[#14E8B4]' : 'bg-[#F5514B]/20 text-[#F5514B]'
                    }`}>
                      {inv.status?.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
