import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NewCustomersAdd() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to ConnectionAdd page as new customer add is now part of new connection
    navigate('/connections/add');
  }, [navigate]);

  return (
    <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
      <div className="text-center text-[#8996AD]">Redirecting to New Connection...</div>
    </div>
  );
}
