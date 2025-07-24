'use client'

import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface VoteResult {
  dj_id: number
  name: string
  image_url?: string
  votes: number
}

interface ChartWrapperProps {
  type: 'bar' | 'pie'
  data: VoteResult[]
  colors: string[]
}

export default function ChartWrapper({ type, data, colors }: ChartWrapperProps) {
  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#B6221A" />
          <XAxis 
            dataKey="name" 
            stroke="#B6221A"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="#B6221A" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#B6221A', 
              border: '1px solid #ffc700',
              borderRadius: '8px',
              color: '#ffc700'
            }}
          />
          <Bar dataKey="votes" fill="#B6221A" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="votes"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#B6221A', 
              border: '1px solid #ffc700',
              borderRadius: '8px',
              color: '#ffc700'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return null
}