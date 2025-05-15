import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ProgressChart = ({ progressData }) => {
  const data = {
    labels: progressData.map((item) => item.date),
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: progressData.map((item) => item.completionRate),
        fill: false,
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Progress',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value) {
            return value + '%';
          },
        },
      },
    },
  };

  return (
    <div className="p-4 mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-gray-200">
        Progress Overview
      </h3>
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default ProgressChart;
