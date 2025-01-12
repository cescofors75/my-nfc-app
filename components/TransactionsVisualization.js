import React, { useState } from 'react';
import { LineChart, LayoutPanelTop } from 'lucide-react';
import TransactionsAnalysis from './TransactionsAnalysis';
import TransactionsChart from './TransactionsChart';

const TransactionsVisualization = () => {
  const [activeTab, setActiveTab] = useState("recharts");

  const chartTypes = [
    {
      id: "recharts",
      name: "Visualización Moderna",
      description: "Vista moderna con estadísticas detalladas",
      icon: LayoutPanelTop,
      component: TransactionsAnalysis
    },
    {
      id: "lightweight",
      name: "Gráfico Financiero",
      description: "Vista técnica con datos en tiempo real",
      icon: LineChart,
      component: TransactionsChart
    }
  ];

return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-lg p-1 space-y-4 transition-colors">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 pb-1">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Análisis de Transacciones
                </h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm">
                    Visualiza y analiza el flujo de transacciones en diferentes formatos
                </p>
            </div>

            {/* Custom Tabs */}
            <div className="w-full sm:w-auto bg-gray-100 dark:bg-slate-800 rounded-lg p-1 transition-colors">
                <div className="flex space-x-1">
                    {chartTypes.map((chart) => {
                        const Icon = chart.icon;
                        const isActive = activeTab === chart.id;
                        return (
                            <button
                                key={chart.id}
                                onClick={() => setActiveTab(chart.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                                    transition-all duration-200 ease-in-out flex-1 sm:flex-none
                                    ${isActive
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100'
                                    }
                                `}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{chart.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="bg-gray-50 dark:bg-slate-800 rounded-lg transition-colors">
            <div className="relative">
                {chartTypes.map((chart) => (
                    activeTab === chart.id && (
                        <div
                            key={chart.id}
                            className="rounded-lg overflow-hidden"
                        >
                            <chart.component />
                        </div>
                    )
                ))}
            </div>
        </div>

        {/* Description */}
        <div className="mt-2 text-sm text-gray-500 dark:text-slate-400 transition-colors">
            {chartTypes.find(chart => chart.id === activeTab)?.description}
        </div>
    </div>
);
}

export default TransactionsVisualization;