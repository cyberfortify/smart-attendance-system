import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line, Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

export default function ChartCard({ type, labels = [], data = [], height = 250 }) {
  const chartData = {
    labels,
    datasets: [
      {
        label: "",
        data,
        backgroundColor:
          type === "pie"
            ? ["#10b981", "#ef4444", "#3b82f6", "#f59e0b"] // ✅ Better colors
            : "rgba(99,102,241,0.6)", // ✅ Slightly more opaque
        borderColor:
          type === "pie"
            ? ["#059669", "#dc2626", "#2563eb", "#d97706"] // ✅ Matching borders
            : "rgba(99,102,241,1)",
        borderWidth: type === "pie" ? 3 : 2, // ✅ Pie thicker border
        tension: type === "line" ? 0.4 : 0, // ✅ Fix for bar/pie
        fill: type === "line" ? true : false, // ✅ Line fill only
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: type === "pie",
        position: "bottom", // ✅ Legend bottom for pie
        labels: {
          padding: 20,
          usePointStyle: true, // ✅ Circle legend dots
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.85)",
        titleColor: "white",
        bodyColor: "white",
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed}%` // ✅ Clean tooltip
        }
      }
    },
    scales: type !== "pie" && { // ✅ Only for line/bar
      x: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { color: "rgba(100,116,139,0.6)" }
      },
      y: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          color: "rgba(100,116,139,0.6)",
          callback: (value) => value + "%"
        },
        max: 100
      }
    },
    elements: {
      bar: { borderRadius: 4 } // ✅ Rounded bars
    }
  };

  return (
    <div
      className="w-full h-full bg-white/80 backdrop-blur-sm border border-slate-100/50 rounded-xl p-3 shadow-sm"
      style={{ height }}
    >
      <div className="w-full h-full" style={{ height: `calc(100% - 0.5rem)` }}>
        {type === "line" && <Line data={chartData} options={options} />}
        {type === "bar" && <Bar data={chartData} options={options} />}
        {type === "pie" && <Pie data={chartData} options={options} />}
      </div>
    </div>
  );
}
