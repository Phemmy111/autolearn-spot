'use client'

import React, { useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { Download } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface QuestionStat {
  id: string
  question_text: string
  correctCount: number
  successRate: number
  difficulty: string
}

interface DifficultyChartProps {
  data: QuestionStat[]
  quizTitle: string
}

export default function DifficultyChart({ data, quizTitle }: DifficultyChartProps) {
  const chartRef = useRef<any>(null)

  const labels = data.map((_, i) => `Q${i + 1}`)
  const successRates = data.map(q => q.successRate)
  const backgroundColors = data.map(q => {
    if (q.difficulty === 'Easiest') return 'rgba(52, 211, 153, 0.8)' // emerald-400
    if (q.difficulty === 'Most Difficult') return 'rgba(248, 113, 113, 0.8)' // red-400
    return 'rgba(251, 191, 36, 0.8)' // amber-400
  })

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Success Rate (%)',
        data: successRates,
        backgroundColor: backgroundColors,
        borderWidth: 1,
        borderColor: '#1f2229'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex
            const q = data[index]
            return [
              `Success: ${Math.round(q.successRate)}%`,
              `Difficulty: ${q.difficulty}`,
              `Text: ${q.question_text.length > 50 ? q.question_text.substring(0, 50) + '...' : q.question_text}`
            ]
          }
        },
        backgroundColor: '#0c0e12',
        titleColor: '#b9cacb',
        bodyColor: '#ffffff',
        borderColor: '#00f0ff',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: '#1f2229'
        },
        ticks: {
          color: '#5d5f63'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#5d5f63'
        }
      }
    }
  }

  const exportCSV = () => {
    const headers = ['Question Number', 'Question Text', 'Success Rate (%)', 'Difficulty', 'Correct Count']
    const rows = data.map((q, i) => [
      `Q${i + 1}`,
      `"${q.question_text.replace(/"/g, '""')}"`, // Escape quotes
      Math.round(q.successRate),
      q.difficulty,
      q.correctCount
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${quizTitle.replace(/\s+/g, '_')}_Analytics.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="border border-[#1f2229] bg-[#0c0e12] rounded-xl overflow-hidden mb-8">
      <div className="p-6 border-b border-[#1f2229] bg-[#111317] flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-white">
          Success Rate per Question
        </h2>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff] font-mono text-xs font-bold uppercase hover:bg-[#00f0ff] hover:text-black transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>
      
      {/* Legend */}
      <div className="px-6 py-4 flex gap-6 bg-[#0c0e12] border-b border-[#1f2229]">
        <div className="flex items-center gap-2 font-mono text-xs text-[#b9cacb]">
          <div className="w-3 h-3 bg-emerald-400 rounded-sm"></div> Easiest (≥80%)
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-[#b9cacb]">
          <div className="w-3 h-3 bg-amber-400 rounded-sm"></div> Moderate (40-80%)
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-[#b9cacb]">
          <div className="w-3 h-3 bg-red-400 rounded-sm"></div> Hard (≤40%)
        </div>
      </div>

      <div className="p-6 w-full h-[400px]">
        <Bar ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  )
}
