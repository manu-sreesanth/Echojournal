import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { TooltipItem } from "chart.js";

Chart.register(...registerables);

const moodColors: Record<string, string> = {
  happy: "#FFF176",
  sad: "#81D4FA",
  anxious: "#FFAB91",
  angry: "#EF9A9A",
  excited: "#F48FB1",
  overwhelmed: "#B39DDB",
  tired: "#CFD8DC",
  okay: "#AED581",
  calm: "#80CBC4",
};

type MoodDataPoint = {
  date: string;
  score: number;
  mood: string;
};

export default function MoodChart({ data }: { data: MoodDataPoint[] }) {
  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: "Mood Score",
        data: data.map((d) => d.score),
        fill: false,
        borderColor: "#4bc0c0",
        backgroundColor: "rgba(75,192,192,0.2)",
        tension: 0.3,
        pointBackgroundColor: data.map(
          (d) => moodColors[d.mood.toLowerCase()] || "#999"
        ),
        pointBorderColor: data.map(
          (d) => moodColors[d.mood.toLowerCase()] || "#666"
        ),
      },
    ],
  };

  const options = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"line">) {
            const mood = data[context.dataIndex].mood;
            const score = context.formattedValue;
            return `Mood: ${mood}, Score: ${score}`;
          },
        },
      },
    },
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <h3>📈 Weekly Mood Trend</h3>
      <Line data={chartData} options={options} />
    </div>
  );
}

