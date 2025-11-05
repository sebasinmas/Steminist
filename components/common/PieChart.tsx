import React from 'react';

interface PieChartData {
    name: string;
    value: number;
    color: string;
}

interface PieChartProps {
    title: string;
    data: PieChartData[];
}

const PieChart: React.FC<PieChartProps> = ({ title, data }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);

    if (total === 0) {
        return (
             <div className="bg-secondary/30 p-4 rounded-lg h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles.</p>
                </div>
            </div>
        );
    }
    
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    
    // By reversing the data and drawing cumulative segments, we ensure smaller segments
    // are drawn on top of larger ones, creating a solid circle with no gaps.
    const reversedData = [...data].reverse();
    let cumulativeValue = 0;

    return (
        <div className="bg-secondary/30 p-4 rounded-lg flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto">
                <svg viewBox="0 0 120 120" className="transform -rotate-90">
                    {reversedData.map((item) => {
                        cumulativeValue += item.value;
                        const dasharray = (cumulativeValue / total) * circumference;

                        return (
                            <circle
                                key={item.name}
                                r={radius}
                                cx="60"
                                cy="60"
                                fill="transparent"
                                stroke={item.color}
                                strokeWidth="20"
                                strokeDasharray={`${dasharray} ${circumference}`}
                                className="transition-all duration-500"
                            />
                        );
                    })}
                </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{total}</span>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
                <ul className="space-y-2 text-sm">
                    {data.map((item, index) => (
                        <li key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: item.color }}
                                ></span>
                                <span className="text-muted-foreground">{item.name}</span>
                            </div>
                            <span className="font-semibold text-foreground">{item.value}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default PieChart;