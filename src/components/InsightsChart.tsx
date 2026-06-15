import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface InsightsChartProps {
  data: Record<string, number>;
}

const COLORS = [
  '#10B981', // Emerald
  '#34D399', // Light Emerald
  '#6EE7B7', // Mint
  '#A7F3D0', // Light Mint
];

export function InsightsChart({ data }: InsightsChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Math.round(value * 100) / 100,
  }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="chart-container card" role="img" aria-label="Carbon emissions breakdown pie chart">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => `${parseFloat(value || 0).toFixed(2)} kg CO₂`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
