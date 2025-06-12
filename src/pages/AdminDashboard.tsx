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

interface UserSummary {
  role: string;
  count: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserSummary[]>([]);

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
    <div className="p-6 bg-black min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      <div className="bg-gray-900 p-6 rounded-lg shadow-md">
        <ChartComponent
          id="user-roles-chart"
          primaryXAxis={primaryXAxis}
          primaryYAxis={primaryYAxis}
          title="Users by Role"
          tooltip={{ enable: true }}
          legendSettings={{ visible: true }}
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
      </div>
    </div>
  );
};

export default AdminDashboard;
