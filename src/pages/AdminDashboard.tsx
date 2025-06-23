import React, { useEffect, useState } from 'react';
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  ColumnSeries,
  Category,
  Tooltip,
  Legend,
  AxisModel,
  ValueType,
  DataLabel,
} from '@syncfusion/ej2-react-charts';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card'; // Make sure Card.tsx exists

interface UserSummary {
  role: string;
  count: number;
}
interface DashboardStats {
  totalUsers: number;
  newCases: number;
  openCases: number;
  closedCases: number;
  recentUsers: {
    fullName: string;
    role: string;
    createdAt: string;
  }[];
}


const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('justicepath-auth');
      const res = await fetch('http://localhost:5000/api/admin/dashboard-stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setStats(data); // Assume you're using useState for stats
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    }
  };

  fetchDashboardStats();
}, []);


  useEffect(() => {
    const fetchUserSummary = async () => {
      try {
        const token = localStorage.getItem('justicepath-auth');
        const res = await fetch('http://localhost:5000/api/admin/user-summary', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch user summary');
        const data = await res.json();
        setUserData(data);
      } catch (err) {
        console.error('Admin Dashboard Error:', err);
      }
    };

    fetchUserSummary();
  }, []);

  const primaryXAxis: AxisModel = {
    valueType: 'Category' as ValueType,
    title: 'User Role',
  };

  const primaryYAxis: AxisModel = {
    title: 'User Count',
  };

  return (
  <div className="bg-[#0d1117] min-h-screen text-white w-full">
    <div className="max-w-screen-2xl mx-auto px-6 pt-24 pb-10">
      <h2 className="text-3xl font-semibold mb-8">Admin Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="w-full">
          <p className="text-sm text-gray-300">Total Users</p>
          <p className="text-3xl font-bold mt-1">{stats?.totalUsers ?? '--'}</p>
        </Card>
        <Card className="w-full">
          <p className="text-sm text-gray-300">New Cases</p>
          <p className="text-3xl font-bold mt-1">{stats?.newCases ?? '--'}</p>
        </Card>
        <Card className="w-full">
          <p className="text-sm text-gray-300">Open Cases</p>
          <p className="text-3xl font-bold mt-1">{stats?.openCases ?? '--'}</p>
        </Card>
        <Card className="w-full">
          <p className="text-sm text-gray-300">Closed Cases</p>
          <p className="text-3xl font-bold mt-1">{stats?.closedCases ?? '--'}</p>
        </Card>
      </div>

      {/* Chart + Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Users by Role Chart */}
        <Card className="w-full h-[360px]">
          <ChartComponent
            id="user-roles-chart"
            primaryXAxis={primaryXAxis}
            primaryYAxis={primaryYAxis}
            title="Users by Role"
            tooltip={{ enable: true }}
            legendSettings={{ visible: false }}
            width="100%"
            height="100%"
          >
            <Inject services={[ColumnSeries, Category, Tooltip, Legend, DataLabel]} />
            <SeriesCollectionDirective>
              <SeriesDirective
                dataSource={userData}
                xName="role"
                yName="count"
                type="Column"
                name="Users"
                marker={{ dataLabel: { visible: true } }}
              />
            </SeriesCollectionDirective>
          </ChartComponent>
        </Card>

        {/* Recent Users Table */}
        <Card className="w-full">
          <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
          <table className="w-full text-sm table-auto">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="pb-2">Name</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Sign Up Date</th>
              </tr>
            </thead>
            <tbody className="text-gray-100">
              <tr className="border-t border-gray-700">
                <td className="py-2">John Doe</td>
                <td className="py-2">User</td>
                <td className="py-2">01/15/2024</td>
              </tr>
              <tr className="border-t border-gray-700">
                <td className="py-2">Jane Smith</td>
                <td className="py-2">Admin</td>
                <td className="py-2">01/14/2024</td>
              </tr>
              <tr className="border-t border-gray-700">
                <td className="py-2">Alice Johnso</td>
                <td className="py-2">Lawyer</td>
                <td className="py-2">01/13/2024</td>
              </tr>
              <tr className="border-t border-gray-700">
                <td className="py-2">Michael Brown</td>
                <td className="py-2">Bonds</td>
                <td className="py-2">01/12/2024</td>
              </tr>
              <tr className="border-t border-gray-700">
                <td className="py-2">Emily Davis</td>
                <td className="py-2">Process Server</td>
                <td className="py-2">01/11/2024</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  </div>
);


};

export default AdminDashboard;
