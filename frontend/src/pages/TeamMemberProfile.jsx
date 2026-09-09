import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

function TeamMemberProfile() {
  const { userId } = useParams();

  const { data: reports } = useQuery({
    queryKey: ['reports', 'user', userId],
    queryFn: async () => {
      const response = await api.get(`/reports/?user_id=${userId}`);
      return response.data.results || response.data;
    },
  });

  // Get user info from first report
  const user = reports?.[0]?.user;

  return (
    <div>
      <h2>👤 {user?.username}'s Reports</h2>
      <p className="text-muted">{user?.email}</p>
      {/* Display reports with statuses */}
    </div>
  );
}