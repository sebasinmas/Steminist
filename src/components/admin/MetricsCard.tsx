import React from 'react';
import Card from '../common/Card';

interface MetricsCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ title, value, icon }) => {
    return (
        <Card className="p-6 bg-gradient-to-br from-card to-secondary/50">
           <div className="flex justify-between items-start">
                 <div className="flex flex-col">
                    <p className="text-3xl lg:text-4xl font-bold text-primary">{value}</p>
                    <h3 className="text-md font-medium text-muted-foreground mt-1">{title}</h3>
                </div>
                <div className="text-primary/70">
                    {icon}
                </div>
           </div>
        </Card>
    );
};

export default MetricsCard;